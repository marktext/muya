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

  enterHandler (event) {
    if (event.shiftKey) {
      event.preventDefault()

      return this.shiftEnterHandler(event)
    }

    const { parent } = this
    // Handler enter in empty paragraph of blockquote.
    if (parent.parent.static.blockName === 'block-quote') {
      return this.enterInBlockQuote(event)
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
