/* eslint-disable no-fallthrough */
/**
 * Hi contributors!
 *
 * Before you edit or update codes in this file,
 * make sure you have read this bellow:
 * Commonmark Spec: https://spec.commonmark.org/0.29/
 * GitHub Flavored Markdown Spec: https://github.github.com/gfm/
 * Pandoc Markdown: https://pandoc.org/MANUAL.html#pandocs-markdown
 * The output markdown needs to obey the standards of these Spec.
 */
import { deepClone } from '../utils';
import logger from '../utils/logger';

import type {
    IAtxHeadingState,
    IBlockQuoteState,
    IBulletListState,
    ICodeBlockState,
    IDiagramState,
    IFrontmatterState,
    IHtmlBlockState,
    IListItemState,
    IMathBlockState,
    IOrderListState,
    IParagraphState,
    ISetextHeadingState,
    ITableState,
    ITaskListItemState,
    ITaskListState,
    IThematicBreakState,
    TState,
} from './types';

const debug = logger('export markdown: ');
function escapeText(str: string) {
    return str.replace(/([^\\])\|/g, '$1\\|');
}

export interface IExportMarkdownOptions {
    listIndentation: number | string;
}

export default class ExportMarkdown {
    private listType: any[];
    private isLooseParentList: boolean;
    private listIndentation: string;
    private listIndentationCount: number;

    constructor(
    {
      listIndentation,
    }: IExportMarkdownOptions = {
      listIndentation: 1,
    },
    ) {
        this.listType = []; // 'ul' or 'ol'
        // helper to translate the first tight item in a nested list
        this.isLooseParentList = true;

        // set and validate settings
        this.listIndentation = 'number';
        if (listIndentation === 'dfm') {
            this.listIndentation = 'dfm';
            this.listIndentationCount = 4;
        }
        else if (typeof listIndentation === 'number') {
            this.listIndentationCount = Math.min(Math.max(listIndentation, 1), 4);
        }
        else {
            this.listIndentationCount = 1;
        }
    }

    generate(states: TState[]) {
        return this.convertStatesToMarkdown(states);
    }

    convertStatesToMarkdown(
        states: TState[],
    indent = '',
    listIndent = '',
    ): string {
        const result = [];
        // helper for CommonMark 264
        let lastListBullet = '';

        for (const state of states) {
            if (
                state.name !== 'order-list'
                && state.name !== 'bullet-list'
                && state.name !== 'task-list'
            ) {
                lastListBullet = '';
            }

            switch (state.name) {
                case 'frontmatter':
                    result.push(this.serializeFrontMatter(state));
                    break;

                case 'paragraph':

                case 'thematic-break':
                    this.insertLineBreak(result, indent);
                    result.push(this.serializeTextParagraph(state, indent));
                    break;

                case 'atx-heading':
                    this.insertLineBreak(result, indent);
                    result.push(this.serializeAtxHeading(state, indent));
                    break;

                case 'setext-heading':
                    this.insertLineBreak(result, indent);
                    result.push(this.serializeSetextHeading(state, indent));
                    break;

                case 'code-block':
                    this.insertLineBreak(result, indent);
                    result.push(this.serializeCodeBlock(state, indent));
                    break;

                case 'html-block':
                    this.insertLineBreak(result, indent);
                    result.push(this.serializeHtmlBlock(state, indent));
                    break;

                case 'math-block':
                    this.insertLineBreak(result, indent);
                    result.push(this.serializeMathBlock(state, indent));
                    break;

                case 'diagram':
                    this.insertLineBreak(result, indent);
                    result.push(this.serializeDiagramBlock(state, indent));
                    break;

                case 'block-quote':
                    this.insertLineBreak(result, indent);
                    result.push(this.serializeBlockquote(state, indent));
                    break;

                case 'table':
                    this.insertLineBreak(result, indent);
                    result.push(this.serializeTable(state, indent));
                    break;

                case 'order-list':

                case 'bullet-list':

                case 'task-list': {
                    let insertNewLine = this.isLooseParentList;
                    this.isLooseParentList = true;
                    const { meta } = state;

                    // Start a new list without separation due changing the bullet or ordered list delimiter starts a new list.
                    const bulletMarkerOrDelimiter
            = (meta as IOrderListState['meta']).delimiter
            || (meta as IBulletListState['meta']).marker;

                    if (lastListBullet && lastListBullet !== bulletMarkerOrDelimiter)
                        insertNewLine = false;

                    lastListBullet = bulletMarkerOrDelimiter;

                    if (insertNewLine)
                        this.insertLineBreak(result, indent);

                    this.listType.push(deepClone(meta));
                    result.push(this.serializeList(state, indent, listIndent));
                    this.listType.pop();
                    break;
                }

                case 'list-item':

                case 'task-list-item': {
                    const { loose } = this.listType[this.listType.length - 1];

                    // helper variable to correct the first tight item in a nested list
                    this.isLooseParentList = loose;
                    if (loose)
                        this.insertLineBreak(result, indent);

                    result.push(this.serializeListItem(state, indent + listIndent));
                    this.isLooseParentList = true;
                    break;
                }

                default: {
                    debug.warn(
                        'convertStatesToMarkdown: Unknown state type:',
                        state.name,
                    );
                    break;
                }
            }
        }

        return result.join('');
    }

    insertLineBreak(result: unknown[], indent: string) {
        if (!result.length)
            return;
        result.push(`${indent}\n`);
    }

    serializeFrontMatter(state: IFrontmatterState) {
        let startToken;
        let endToken;
        switch (state.meta.lang) {
            case 'yaml':
                startToken = '---\n';
                endToken = '---\n';
                break;

            case 'toml':
                startToken = '+++\n';
                endToken = '+++\n';
                break;

            case 'json':
                if (state.meta.style === ';') {
                    startToken = ';;;\n';
                    endToken = ';;;\n';
                }
                else {
                    startToken = '{\n';
                    endToken = '}\n';
                }
                break;
        }

        const result = [];
        result.push(startToken);
        const { text } = state;
        const lines = text.split('\n');

        for (const line of lines)
            result.push(`${line}\n`);

        result.push(endToken);

        return result.join('');
    }

    serializeTextParagraph(
        state: IParagraphState | IThematicBreakState,
        indent: string,
    ) {
        const { text } = state;
        const lines = text.split('\n');

        return `${lines.map(line => `${indent}${line}`).join('\n')}\n`;
    }

    serializeAtxHeading(state: IAtxHeadingState, indent: string) {
        const { text } = state;
        const match = text.match(/(#{1,6})(.*)/);

        const atxHeadingText = `${match?.[1]} ${match?.[2].trim()}`;

        return `${indent}${atxHeadingText}\n`;
    }

    serializeSetextHeading(state: ISetextHeadingState, indent: string) {
        const { text, meta } = state;
        const { underline } = meta;
        const lines = text.trim().split('\n');

        return (
            `${lines.map(line => `${indent}${line}`).join('\n')
       }\n${indent}${underline.trim()}\n`
        );
    }

    serializeCodeBlock(state: ICodeBlockState, indent: string) {
        const result = [];
        const { text, meta } = state;
        const textList = text.split('\n');
        const { type, lang } = meta;

        if (type === 'fenced') {
            result.push(`${indent}${lang ? `\`\`\`${lang}\n` : '```\n'}`);
            textList.forEach((text) => {
                result.push(`${indent}${text}\n`);
            });
            result.push(`${indent}\`\`\`\n`);
        }
        else {
            textList.forEach((text) => {
                result.push(`${indent}    ${text}\n`);
            });
        }

        return result.join('');
    }

    serializeHtmlBlock(state: IHtmlBlockState, indent: string) {
        const result = [];
        const { text } = state;
        const lines = text.split('\n');

        for (const line of lines)
            result.push(`${indent}${line}\n`);

        return result.join('');
    }

    serializeMathBlock(state: IMathBlockState, indent: string) {
        const result = [];
        const {
            text,
            meta: { mathStyle },
        } = state;
        const lines = text.split('\n');
        result.push(indent + (mathStyle === '' ? '$$\n' : '```math\n'));

        for (const line of lines)
            result.push(`${indent}${line}\n`);

        result.push(indent + (mathStyle === '' ? '$$\n' : '```\n'));

        return result.join('');
    }

    serializeDiagramBlock(state: IDiagramState, indent: string) {
        const result = [];
        const {
            text,
            meta: { type },
        } = state;
        const lines = text.split('\n');
        result.push(`${indent}\`\`\`${type}\n`);

        for (const line of lines)
            result.push(`${indent}${line}\n`);

        result.push(`${indent}\`\`\`\n`);

        return result.join('');
    }

    serializeBlockquote(state: IBlockQuoteState, indent: string) {
        const { children } = state;
        const newIndent = `${indent}> `;

        return this.convertStatesToMarkdown(children, newIndent);
    }

    serializeTable(state: ITableState, indent: string) {
        const result: string[] = [];
        const row = state.children.length;
        const column = state.children[0].children.length;
        const tableData = [];

        for (const rowState of state.children) {
            tableData.push(
                rowState.children.map(cell => escapeText(cell.text.trim())),
            );
        }

        const columnWidth = state.children[0].children.map(th => ({
            width: 5,
            align: th.meta.align,
        }));

        let i;
        let j;

        for (i = 0; i < row; i++) {
            for (j = 0; j < column; j++) {
                columnWidth[j].width = Math.max(
                    columnWidth[j].width,
                    tableData[i][j].length + 2,
                ); // add 2, because have two space around text
            }
        }

        tableData.forEach((r, i) => {
            const rs
        = `${indent
         }|${
         r
            .map((cell, j) => {
                const raw = ` ${cell + ' '.repeat(columnWidth[j].width)}`;

                return raw.substring(0, columnWidth[j].width);
            })
            .join('|')
         }|`;
            result.push(rs);
            if (i === 0) {
                const cutOff
          = `${indent
           }|${
           columnWidth
              .map(({ width, align }) => {
                  let raw = '-'.repeat(width - 2);
                  switch (align) {
                      case 'left':
                          raw = `:${raw} `;
                          break;

                      case 'center':
                          raw = `:${raw}:`;
                          break;

                      case 'right':
                          raw = ` ${raw}:`;
                          break;
                      default:
                          raw = ` ${raw} `;
                          break;
                  }

                  return raw;
              })
              .join('|')
           }|`;
                result.push(cutOff);
            }
        });

        return `${result.join('\n')}\n`;
    }

    serializeList(
        state: IBulletListState | IOrderListState | ITaskListState,
        indent: string,
        listIndent: string,
    ) {
        const { children } = state;

        return this.convertStatesToMarkdown(children, indent, listIndent);
    }

    serializeListItem(
        state: IListItemState | ITaskListItemState,
        indent: string,
    ) {
        const result = [];
        const listInfo = this.listType[this.listType.length - 1];
        const { marker, delimiter, start } = listInfo;
        const isUnorderedList = !!marker;
        const { children, name } = state;
        let itemMarker;

        if (isUnorderedList) {
            itemMarker = marker ? `${marker} ` : '- ';
        }
        else {
            // NOTE: GitHub and Bitbucket limit the list count to 99 but this is nowhere defined.
            //  We limit the number to 99 for Daring Fireball Markdown to prevent indentation issues.
            let n = start;
            if ((this.listIndentation === 'dfm' && n > 99) || n > 999999999)
                n = 1;

            listInfo.start++;

            itemMarker = `${n}${delimiter || '.'} `;
        }

        // Subsequent paragraph indentation
        const newIndent = indent + ' '.repeat(itemMarker.length);

        // New list indentation. We already added one space to the indentation
        let listIndent = '';
        const { listIndentation } = this;
        if (listIndentation === 'dfm')
            listIndent = ' '.repeat(4 - itemMarker.length);
        else if (listIndentation === 'number')
            listIndent = ' '.repeat(this.listIndentationCount - 1);

        // TODO: Indent subsequent paragraphs by one tab. - not important
        //  Problem: "convertStatesToMarkdown" use "indent" in spaces to indent elements. How should
        //  we integrate tabs in block quotes and subsequent paragraphs and how to combine with spaces?
        //  I don't know how to combine tabs and spaces and it seems not specified, so work for another day.

        if (name === 'task-list-item')
            itemMarker += state.meta.checked ? '[x] ' : '[ ] ';

        result.push(`${indent}${itemMarker}`);
        result.push(
            this.convertStatesToMarkdown(children, newIndent, listIndent).substring(
                newIndent.length,
            ),
        );

        return result.join('');
    }
}
