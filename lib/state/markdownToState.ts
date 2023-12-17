import logger from '@muya/utils/logger';
import { lexBlock } from '@muya/utils/marked';
import { TState } from './types';

const debug = logger('import markdown: ');
const restoreTableEscapeCharacters = (text: string) => {
  // NOTE: markedjs replaces all escaped "|" ("\|") characters inside a cell with "|".
  //       We have to re-escape the character to not break the table.
  return text.replace(/\|/g, '\\|');
};

type MarkdownToStateOptions = {
  footnote: boolean;
  math: boolean;
  isGitlabCompatibilityEnabled: boolean;
  trimUnnecessaryCodeBlockEmptyLines: boolean;
  frontMatter: boolean;
};

const DEFAULT_OPTIONS = {
  footnote: false,
  math: true,
  isGitlabCompatibilityEnabled: true,
  trimUnnecessaryCodeBlockEmptyLines: false,
  frontMatter: true,
};

class MarkdownToState {
  constructor(private options: MarkdownToStateOptions = DEFAULT_OPTIONS) {}

  generate(markdown: string): TState[] {
    return this.convertMarkdownToState(markdown);
  }

  convertMarkdownToState(markdown: string): TState[] {
    const {
      footnote = false,
      math = true,
      isGitlabCompatibilityEnabled = true,
      trimUnnecessaryCodeBlockEmptyLines = false,
      frontMatter = true,
    } = this.options;

    const tokens = lexBlock(markdown, {
      footnote,
      math,
      frontMatter,
      isGitlabCompatibilityEnabled,
    });

    const states: TState[] = [];
    let token;
    let state;
    let value;
    const parentList: TState[][] = [states];

    while ((token = tokens.shift())) {
      switch (token.type) {
        // Marks the end of the children's traversal and a return to the previous level
        case 'block-end': {
          // Fix #1735 the blockquote maybe empty. like bellow:
          // >
          // bar
          if (parentList[0].length === 0 && token.tokenType === 'blockquote') {
            state = {
              name: 'paragraph' as const,
              text: '',
            };
            parentList[0].push(state);
          }
          parentList.shift();
          break;
        }

        case 'frontmatter': {
          const { lang, style, text } = token;
          value = text.replace(/^\s+/, '').replace(/\s$/, '');

          state = {
            name: 'frontmatter' as const,
            meta: {
              lang,
              style,
            },
            text: value,
          };

          parentList[0].push(state);
          break;
        }

        case 'hr': {
          state = {
            name: 'thematic-break' as const,
            text: token.raw.replace(/\n+$/, ''),
          };

          parentList[0].push(state);
          break;
        }

        case 'heading': {
          const { headingStyle, depth, text, marker } = token;
          const name =
            headingStyle === 'atx' ? 'atx-heading' : 'setext-heading';
          const meta: any = {
            level: depth,
          };
          if (name === 'setext-heading') {
            meta.underline = marker;
          }
          value =
            name === 'atx-heading' ? '#'.repeat(+depth) + ` ${text}` : text;

          state = {
            name,
            meta,
            text: value,
          };

          parentList[0].push(state);
          break;
        }

        case 'code': {
          const { codeBlockStyle, text, lang: infoString = '' } = token;

          // GH#697, markedjs#1387
          const lang = (infoString || '').match(/\S*/)[0];

          value = text;
          // Fix: #1265.
          if (
            trimUnnecessaryCodeBlockEmptyLines &&
            (value.endsWith('\n') || value.startsWith('\n'))
          ) {
            value = value.replace(/\n+$/, '').replace(/^\n+/, '');
          }

          if (/mermaid|vega-lite|plantuml/.test(lang)) {
            state = {
              name: 'diagram' as const,
              text: value,
              meta: {
                type: lang,
                lang: lang === 'vega-lite' ? 'json' : 'yaml',
              },
            };
          } else {
            state = {
              name: 'code-block' as const,
              meta: {
                type: codeBlockStyle === 'fenced' ? 'fenced' : 'indented',
                lang,
              },
              text: value,
            };
          }
          parentList[0].push(state);
          break;
        }

        case 'table': {
          const { header, align, rows } = token;

          state = {
            name: 'table',
            children: [],
          };

          state.children.push({
            name: 'table.row',
            children: header.map((h, i) => ({
              name: 'table.cell',
              meta: { align: align[i] || 'none' },
              text: restoreTableEscapeCharacters(h.text),
            })),
          });

          state.children.push(
            ...rows.map((row) => ({
              name: 'table.row',
              children: row.map((c, i) => ({
                name: 'table.cell',
                meta: { align: align[i] || 'none' },
                text: restoreTableEscapeCharacters(c.text),
              })),
            }))
          );

          parentList[0].push(state);
          break;
        }

        case 'html': {
          const text = token.text.trim();
          // TODO: Treat html state which only contains one img as paragraph, we maybe add image state in the future.
          const isSingleImage = /^<img[^<>]+>$/.test(text);
          if (isSingleImage) {
            state = {
              name: 'paragraph',
              text,
            };
            parentList[0].push(state);
          } else {
            state = {
              name: 'html-block',
              text,
            };
            parentList[0].push(state);
          }
          break;
        }

        case 'multiplemath': {
          const text = token.text.trim();
          const { mathStyle = '' } = token;
          const state = {
            name: 'math-block',
            text,
            meta: { mathStyle },
          };
          parentList[0].push(state);
          break;
        }

        case 'text': {
          value = token.text;
          while (tokens[0].type === 'text') {
            token = tokens.shift();
            value += `\n${token.text}`;
          }
          state = {
            name: 'paragraph',
            text: value,
          };
          parentList[0].push(state);
          break;
        }

        case 'paragraph': {
          value = token.text;
          state = {
            name: 'paragraph',
            text: value,
          };
          parentList[0].push(state);
          break;
        }

        case 'blockquote': {
          state = {
            name: 'block-quote',
            children: [],
          };
          parentList[0].push(state);
          parentList.unshift(state.children);
          tokens.unshift({ type: 'block-end', tokenType: 'blockquote' });
          tokens.unshift(...token.tokens);
          break;
        }

        case 'list': {
          const { listType, loose, start } = token;
          const bulletMarkerOrDelimiter = token.items[0].bulletMarkerOrDelimiter;
          const meta: any = {
            loose,
          }
          if (listType === 'order') {
            meta.start = /^\d+$/.test(start) ? start : 1;
            meta.delimiter = bulletMarkerOrDelimiter || '.';
          } else {
            meta.marker = bulletMarkerOrDelimiter || '-';
          }
          state = {
            name: `${listType}-list`,
            meta,
            children: [],
          };

          parentList[0].push(state);
          parentList.unshift(state.children);
          tokens.unshift({ type: 'block-end', tokenType: 'list' });
          tokens.unshift(...token.items);
          break;
        }

        case 'list_item': {
          const { checked, listItemType } = token;

          state = {
            name: listItemType === 'task' ? 'task-list-item' : 'list-item',
            children: [],
          };

          if (listItemType === 'task') {
            state.meta = { checked };
          }

          parentList[0].push(state);
          parentList.unshift(state.children);
          tokens.unshift({ type: 'block-end', tokenType: 'list-item' });
          tokens.unshift(...token.tokens);
          break;
        }

        case 'space': {
          break;
        }

        default:
          debug.warn(`Unknown type ${token.type}`);
          break;
      }
    }

    return states.length ? states : [{ name: 'paragraph', text: '' }];
  }
}

export default MarkdownToState;
