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

  enterHandler (event) {
    if (event.shiftKey) {
      event.preventDefault()

      return this.shiftEnterHandler(event)
    }

    super.enterHandler(event)
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
