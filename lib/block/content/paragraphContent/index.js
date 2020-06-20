import Format from '@/block/base/format'
import { mixins } from '@/utils'
import backspaceHandler from './backspace'

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
}

mixins(ParagraphContent, backspaceHandler)

export default ParagraphContent
