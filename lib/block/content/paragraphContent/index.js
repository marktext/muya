import Format from '@/block/base/format'
import { mixins } from '@/utils'
import backspaceHandler from './backspace'
import Selection from '@/selection'
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

  enterHandler (event) {
    if (event.shiftKey) {
      event.preventDefault()

      return this.shiftEnterHandler(event)
    }

    const { text } = this
    if (text.length === 0 && this.parent.parent.static.blockName === 'block-quote') {
      event.preventDefault()
      event.stopPropagation()

      const newNode = this.parent.clone()
      const blockQuote = this.parent.parent
      blockQuote.parent.insertAfter(newNode, blockQuote)
      this.parent.remove()
      newNode.children.head.setCursor(0, 0, true)
    } else {
      super.enterHandler(event)
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
