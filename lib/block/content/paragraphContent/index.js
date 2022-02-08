import Format from '@/block/base/format'
import { mixins, isLengthEven } from '@/utils'
import backspaceHandler from './backspace'
import tabHandler from './tab'
import ScrollPage from '@/block/scrollPage'
import logger from '@/utils/logger'
import { VOID_HTML_TAGS, HTML_TAGS } from '@/config'

const HTML_BLOCK_REG = /^<([a-zA-Z\d-]+)(?=\s|>)[^<>]*?>$/
const checkQuickInsert = (text) => /^\/\S*$/.test(text)
const checkShowPlaceholder = (text) => /^\/$/.test(text)

const debug = logger('paragraph:content')

const parseTableHeader = (text) => {
  const rowHeader = []
  const len = text.length
  let i

  for (i = 0; i < len; i++) {
    const char = text[i]
    if (/^[^|]$/.test(char)) {
      rowHeader[rowHeader.length - 1] += char
    }

    if (/\\/.test(char)) {
      rowHeader[rowHeader.length - 1] += text[++i]
    }

    if (/\|/.test(char) && i !== len - 1) {
      rowHeader.push('')
    }
  }

  return rowHeader
}

class ParagraphContent extends Format {
  static blockName = 'paragraph.content'

  static create (muya, text) {
    const content = new ParagraphContent(muya, text)

    return content
  }

  constructor (muya, text) {
    super(muya, text)
    this.classList = [...this.classList, 'mu-paragraph-content']
    this.createDomNode()
  }

  getAnchor () {
    return this.parent
  }

  update (cursor, highlights = []) {
    this.inlineRenderer.patch(this, cursor, highlights)
    const { label } = this.inlineRenderer.getLabelInfo(this)
    if (this.scrollPage && label) {
      this.scrollPage.updateRefLinkAndImage(label)
    }
  }

  inputHandler (event) {
    super.inputHandler(event)
    const { text, domNode } = this
    const { eventCenter } = this.muya
    // Check wheather need to show code picker
    const token = text.match(/(^ {0,3}`{3,})([^` ]+)/)
    if (token && token[2]) {
      eventCenter.emit('muya-code-picker', {
        reference: domNode,
        block: this,
        lang: token[2]
      })
    } else {
      eventCenter.emit('muya-code-picker', { reference: null })
    }
    // Check wheather need to show quick insert pannel
    const needToShowQuickInsert = checkQuickInsert(text)
    const needToShowPlacehoder = checkShowPlaceholder(text)
    if (needToShowPlacehoder) {
      domNode.setAttribute('placeholder', 'Search keyword...')
    } else {
      domNode.removeAttribute('placeholder')
    }
    eventCenter.emit('muya-quick-insert', {
      reference: domNode,
      block: this,
      status: !!needToShowQuickInsert
    })
  }

  enterConvert (event) {
    event.preventDefault()
    event.stopPropagation()
    const TABLE_BLOCK_REG = /^\|.*?(\\*)\|.*?(\\*)\|/
    const MATH_BLOCK_REG = /^\$\$/
    const { text } = this
    const codeBlockToken = text.match(/(^ {0,3}`{3,})([^` ]*)/)
    const tableMatch = TABLE_BLOCK_REG.exec(text)
    const htmlMatch = HTML_BLOCK_REG.exec(text)
    const mathMath = MATH_BLOCK_REG.exec(text)
    const tagName =
      htmlMatch && htmlMatch[1] && HTML_TAGS.find((t) => t === htmlMatch[1])

    if (mathMath) {
      const state = {
        name: 'math-block',
        text: '',
        meta: {
          mathStyle: ''
        }
      }
      const mathBlock = ScrollPage.loadBlock('math-block').create(
        this.muya,
        state
      )
      this.parent.replaceWith(mathBlock)
      mathBlock.firstContentInDescendant().setCursor(0, 0)
    } else if (codeBlockToken) {
      // Convert to code block
      const lang = codeBlockToken[2]
      const state = {
        name: 'code-block',
        meta: {
          lang,
          type: 'fenced'
        },
        text: ''
      }
      const codeBlock = ScrollPage.loadBlock(state.name).create(
        this.muya,
        state
      )

      this.parent.replaceWith(codeBlock)

      codeBlock.lastContentInDescendant().setCursor(0, 0)
    } else if (
      tableMatch &&
      isLengthEven(tableMatch[1]) &&
      isLengthEven(tableMatch[2])
    ) {
      const tableHeader = parseTableHeader(this.text)
      const tableBlock = ScrollPage.loadBlock('table').createWithHeader(
        this.muya,
        tableHeader
      )

      this.parent.replaceWith(tableBlock)

      // Set cursor at the first cell of second row.
      tableBlock.firstChild
        .find(1)
        .firstContentInDescendant()
        .setCursor(0, 0, true)
    } else if (VOID_HTML_TAGS.indexOf(tagName) === -1 && tagName) {
      const state = {
        name: 'html-block',
        text: `<${tagName}>\n\n</${tagName}>`
      }
      const htmlBlock = ScrollPage.loadBlock('html-block').create(
        this.muya,
        state
      )
      this.parent.replaceWith(htmlBlock)
      const offset = tagName.length + 3
      htmlBlock.firstContentInDescendant().setCursor(offset, offset)
    } else {
      return super.enterHandler(event)
    }
  }

  enterInBlockQuote (event) {
    const { text, parent } = this
    if (text.length !== 0) {
      return super.enterHandler(event)
    }

    event.preventDefault()
    event.stopPropagation()

    const newNode = parent.clone()
    const blockQuote = parent.parent

    switch (true) {
      case parent.isOnlyChild():
        blockQuote.parent.insertBefore(newNode, blockQuote)
        blockQuote.remove()
        break

      case parent.isFirstChild():
        blockQuote.parent.insertBefore(newNode, blockQuote)
        parent.remove()
        break

      case parent.isLastChild():
        blockQuote.parent.insertAfter(newNode, blockQuote)
        parent.remove()
        break

      default: {
        const newBlockState = {
          name: 'block-quote',
          children: []
        }
        const offset = blockQuote.offset(parent)
        blockQuote.forEachAt(offset + 1, undefined, (node) => {
          newBlockState.children.push(node.getState())
          node.remove()
        })
        const newBlockQuote = ScrollPage.loadBlock(newBlockState.name).create(
          this.muya,
          newBlockState
        )
        blockQuote.parent.insertAfter(newNode, blockQuote)
        blockQuote.parent.insertAfter(newBlockQuote, newNode)
        parent.remove()
        break
      }
    }

    newNode.children.head.setCursor(0, 0, true)
  }

  enterInListItem (event) {
    event.preventDefault()
    event.stopPropagation()

    const { text, parent, muya } = this
    const { start, end } = this.getCursor()
    const listItem = parent.parent
    const list = listItem.parent

    if (text.length === 0) {
      if (parent.isOnlyChild()) {
        switch (true) {
          case listItem.isOnlyChild(): {
            const newParagraph = parent.clone()
            list.replaceWith(newParagraph)
            newParagraph.firstContentInDescendant().setCursor(0, 0)
            break
          }

          case listItem.isFirstChild(): {
            const newParagraph = parent.clone()
            listItem.remove()
            list.parent.insertBefore(newParagraph, list)
            newParagraph.firstContentInDescendant().setCursor(0, 0)
            break
          }

          case listItem.isLastChild(): {
            const newParagraph = parent.clone()
            listItem.remove()
            list.parent.insertAfter(newParagraph, list)
            newParagraph.firstContentInDescendant().setCursor(0, 0)
            break
          }

          default: {
            const newParagraph = parent.clone()
            const newListState = {
              name: list.blockName,
              meta: { ...list.meta },
              children: []
            }
            const offset = list.offset(listItem)
            list.forEachAt(offset + 1, undefined, (node) => {
              newListState.children.push(node.getState())
              node.remove()
            })
            const newList = ScrollPage.loadBlock(newListState.name).create(
              this.muya,
              newListState
            )
            list.parent.insertAfter(newParagraph, list)
            list.parent.insertAfter(newList, newParagraph)
            listItem.remove()
            newParagraph.firstContentInDescendant().setCursor(0, 0)
            break
          }
        }
      } else {
        const newListItemState = {
          name: listItem.blockName,
          children: []
        }

        if (listItem.blockName === 'task-list-item') {
          newListItemState.meta = { checked: false }
        }

        const offset = listItem.offset(parent)
        listItem.forEachAt(offset, undefined, (node) => {
          newListItemState.children.push(node.getState())
          node.remove()
        })

        const newListItem = ScrollPage.loadBlock(newListItemState.name).create(
          this.muya,
          newListItemState
        )
        list.insertAfter(newListItem, listItem)

        newListItem.firstContentInDescendant().setCursor(0, 0)
      }
    } else {
      if (parent.isOnlyChild()) {
        this.text = text.substring(0, start.offset)
        const newNodeState = {
          name: listItem.blockName,
          children: [
            {
              name: 'paragraph',
              text: text.substring(end.offset)
            }
          ]
        }

        if (listItem.blockName === 'task-list-item') {
          newNodeState.meta = {
            checked: false
          }
        }

        const newListItem = ScrollPage.loadBlock(newNodeState.name).create(
          muya,
          newNodeState
        )

        list.insertAfter(newListItem, listItem)

        this.update()
        newListItem.firstContentInDescendant().setCursor(0, 0, true)
      } else {
        super.enterHandler(event)
      }
    }
  }

  enterHandler (event) {
    if (event.shiftKey) {
      return this.shiftEnterHandler(event)
    }

    const type = this.paragraphParentType()

    if (type === 'block-quote') {
      this.enterInBlockQuote(event)
    } else if (type === 'list-item' || type === 'task-list-item') {
      this.enterInListItem(event)
    } else {
      this.enterConvert(event)
    }
  }

  backspaceHandler (event) {
    const { start, end } = this.getCursor()

    if (start.offset === 0 && end.offset === 0) {
      event.preventDefault()
      const type = this.paragraphParentType()

      switch (type) {
        case 'paragraph':
          return this.handleBackspaceInParagraph()

        case 'block-quote':
          return this.handleBackspaceInBlockQuote()

        case 'list-item':

        case 'task-list-item':
          return this.handleBackspaceInList()

        default:
          debug.error('Unknown backspace type')
          break
      }
    } else {
      super.backspaceHandler(event)
    }
  }
}

mixins(ParagraphContent, backspaceHandler, tabHandler)

export default ParagraphContent
