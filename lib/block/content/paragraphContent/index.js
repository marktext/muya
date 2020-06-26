import Format from '@/block/base/format'
import { mixins } from '@/utils'
import backspaceHandler from './backspace'
import Selection from '@/selection'
import ScrollPage from '@/block/scrollPage'
import logger from '@/utils/logger'

const debug = logger('paragraph:content')

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

  update (cursor) {
    return this.inlineRenderer.patch(this, cursor)
  }

  inputHandler (event) {
    super.inputHandler(event)
    const { text } = this
    const { eventCenter } = this.muya
    const token = text.match(/(^ {0,3}`{3,})([^` ]+)/)
    if (token && token[2]) {
      const reference = this.domNode
      eventCenter.emit('muya-code-picker', {
        reference,
        block: this,
        lang: token[2]
      })
    } else {
      eventCenter.emit('muya-code-picker', { reference: null })
    }
  }

  enterConvert (event) {
    event.preventDefault()
    event.stopPropagation()

    const { text } = this
    const token = text.match(/(^ {0,3}`{3,})([^` ]*)/)

    if (token) {
      // Convert to code block
      const lang = token[2]
      const state = {
        name: 'code-block',
        meta: {
          lang,
          type: 'fenced'
        },
        text: ''
      }
      const codeBlock = ScrollPage.loadBlock(state.name).create(this.muya, state)
      this.parent.replaceWith(codeBlock)
      codeBlock.lastContentInDescendant().setCursor(0, 0)
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
        blockQuote.forEachAt(offset + 1, undefined, node => {
          newBlockState.children.push(node.getState())
          node.remove()
        })
        const newBlockQuote = ScrollPage.loadBlock(newBlockState.name).create(this.muya, newBlockState)
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
    const { start, end } = Selection.getCursorOffsets(this.domNode)
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
              name: list.static.blockName,
              meta: { ...list.meta },
              children: []
            }
            const offset = list.offset(listItem)
            list.forEachAt(offset + 1, undefined, node => {
              newListState.children.push(node.getState())
              node.remove()
            })
            const newList = ScrollPage.loadBlock(newListState.name).create(this.muya, newListState)
            list.parent.insertAfter(newParagraph, list)
            list.parent.insertAfter(newList, newParagraph)
            listItem.remove()
            newParagraph.firstContentInDescendant().setCursor(0, 0)
            break
          }
        }
      } else {
        const newListItemState = {
          name: listItem.static.blockName,
          children: []
        }

        if (listItem.static.blockName === 'task-list-item') {
          newListItemState.meta = { checked: false }
        }

        const offset = listItem.offset(parent)
        listItem.forEachAt(offset, undefined, node => {
          newListItemState.children.push(node.getState())
          node.remove()
        })

        const newListItem = ScrollPage.loadBlock(newListItemState.name).create(this.muya, newListItemState)
        list.insertAfter(newListItem, listItem)

        newListItem.firstContentInDescendant().setCursor(0, 0)
      }
    } else {
      if (parent.isOnlyChild()) {
        this.text = text.substring(0, start.offset)
        const newNodeState = {
          name: listItem.static.blockName,
          children: [{
            name: 'paragraph',
            text: text.substring(end.offset)
          }]
        }

        if (listItem.static.blockName === 'task-list-item') {
          newNodeState.meta = {
            checked: false
          }
        }

        const newListItem = ScrollPage.loadBlock(newNodeState.name).create(muya, newNodeState)

        listItem.parent.insertAfter(newListItem, listItem)

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
    const { start, end } = Selection.getCursorOffsets(this.domNode)

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

mixins(ParagraphContent, backspaceHandler)

export default ParagraphContent
