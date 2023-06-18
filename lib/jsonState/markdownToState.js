import { Lexer } from '@/utils/marked'
import logger from '@/utils/logger'

const debug = logger('import markdown: ')
const restoreTableEscapeCharacters = text => {
  // NOTE: markedjs replaces all escaped "|" ("\|") characters inside a cell with "|".
  //       We have to re-escape the chraracter to not break the table.
  return text.replace(/\|/g, '\\|')
}

class MarkdownToState {
  constructor (options = {}) {
    this.options = options
  }

  generate (markdown) {
    return this.convertMarkdownToState(markdown)
  }

  convertMarkdownToState (markdown) {
    const states = []
    const {
      footnote = false,
      isGitlabCompatibilityEnabled = false,
      superSubScript = false,
      trimUnnecessaryCodeBlockEmptyLines = false,
      frontMatter = true
    } = this.options

    const tokens = new Lexer({
      disableInline: true,
      footnote,
      isGitlabCompatibilityEnabled,
      superSubScript,
      frontMatter
    }).lex(markdown)

    let token
    let state
    let value
    const parentList = [states]

    while ((token = tokens.shift())) {
      switch (token.type) {
        case 'frontmatter': {
          const { lang, style, text } = token
          value = text
            .replace(/^\s+/, '')
            .replace(/\s$/, '')

          state = {
            name: 'frontmatter',
            meta: {
              lang,
              style
            },
            text: value
          }

          parentList[0].push(state)
          break
        }

        case 'hr': {
          state = {
            name: 'thematic-break',
            text: token.marker
          }

          parentList[0].push(state)
          break
        }

        case 'heading': {
          const { headingStyle, depth, text, marker } = token
          const name = headingStyle === 'atx' ? 'atx-heading' : 'setext-heading'
          const meta = {
            level: depth
          }
          if (name === 'setext-heading') {
            meta.underline = marker
          }
          value = name === 'atx-heading' ? '#'.repeat(+depth) + ` ${text}` : text

          state = {
            name,
            meta,
            text: value
          }

          parentList[0].push(state)
          break
        }

        case 'code': {
          const { codeBlockStyle, text, lang: infostring = '' } = token

          // GH#697, markedjs#1387
          const lang = (infostring || '').match(/\S*/)[0]

          value = text
          // Fix: #1265.
          if (trimUnnecessaryCodeBlockEmptyLines && (value.endsWith('\n') || value.startsWith('\n'))) {
            value = value
              .replace(/\n+$/, '')
              .replace(/^\n+/, '')
          }

          if (/mermaid|flowchart|vega-lite|sequence|plantuml/.test(lang)) {
            state = {
              name: 'diagram',
              text: value,
              meta: {
                type: lang,
                lang: lang === 'vega-lite' ? 'json' : 'yaml'
              }
            }
          } else {
            state = {
              name: 'code-block',
              meta: {
                type: codeBlockStyle === 'fenced' ? 'fenced' : 'indented',
                lang
              },
              text: value
            }
          }
          parentList[0].push(state)
          break
        }

        case 'table': {
          const { header, align, cells } = token

          state = {
            name: 'table',
            children: []
          }

          state.children.push({
            name: 'table.row',
            children: header.map((h, i) => ({
              name: 'table.cell',
              meta: { align: align[i] || 'none' },
              text: restoreTableEscapeCharacters(h)
            }))
          })

          state.children.push(...cells.map(row => ({
            name: 'table.row',
            children: row.map((c, i) => ({
              name: 'table.cell',
              meta: { align: align[i] || 'none' },
              text: restoreTableEscapeCharacters(c)
            }))
          })))

          parentList[0].push(state)
          break
        }

        case 'html': {
          const text = token.text.trim()
          // TODO: Treat html state which only contains one img as paragraph, we maybe add image state in the future.
          const isSingleImage = /^<img[^<>]+>$/.test(text)
          if (isSingleImage) {
            state = {
              name: 'paragraph',
              text
            }
            parentList[0].push(state)
          } else {
            state = {
              name: 'html-block',
              text
            }
            parentList[0].push(state)
          }
          break
        }

        case 'multiplemath': {
          const text = token.text.trim()
          const { mathStyle = '' } = token
          const state = {
            name: 'math-block',
            text,
            meta: { mathStyle }
          }
          parentList[0].push(state)
          break
        }

        case 'text': {
          value = token.text
          while (tokens[0].type === 'text') {
            token = tokens.shift()
            value += `\n${token.text}`
          }
          state = {
            name: 'paragraph',
            text: value
          }
          parentList[0].push(state)
          break
        }

        case 'paragraph': {
          value = token.text
          state = {
            name: 'paragraph',
            text: value
          }
          parentList[0].push(state)
          break
        }

        case 'blockquote_start': {
          state = {
            name: 'block-quote',
            children: []
          }
          parentList[0].push(state)
          parentList.unshift(state.children)
          break
        }

        case 'blockquote_end': {
          // Fix #1735 the blockquote maybe empty.
          if (parentList[0].length === 0) {
            state = {
              name: 'paragraph',
              text: ''
            }
            parentList[0].push(state)
          }
          parentList.shift()
          break
        }

        case 'list_start': {
          const { listType, start } = token
          const { bulletMarkerOrDelimiter, type } = tokens.find(t => t.type === 'loose_item_start' || t.type === 'list_item_start')
          const meta = {
            loose: type === 'loose_item_start'
          }
          if (listType === 'order') {
            meta.start = /^\d+$/.test(start) ? start : 1
            meta.delimiter = bulletMarkerOrDelimiter || '.'
          } else {
            meta.marker = bulletMarkerOrDelimiter || '-'
          }

          state = {
            name: `${listType}-list`,
            meta,
            children: []
          }

          parentList[0].push(state)
          parentList.unshift(state.children)
          break
        }

        case 'list_end': {
          parentList.shift()
          break
        }

        case 'loose_item_start':

        case 'list_item_start': {
          const { checked } = token

          state = {
            name: checked !== undefined ? 'task-list-item' : 'list-item',
            children: []
          }

          if (checked !== undefined) {
            state.meta = { checked }
          }

          parentList[0].push(state)
          parentList.unshift(state.children)
          break
        }

        case 'list_item_end': {
          parentList.shift()
          break
        }

        case 'space': {
          break
        }

        default:
          debug.warn(`Unknown type ${token.type}`)
          break
      }
    }

    return states.length ? states : [{ name: 'paragraph', text: '' }]
  }
}

export default MarkdownToState
