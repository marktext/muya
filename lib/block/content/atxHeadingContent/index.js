import Format from '@/block/base/format'
import Selection from '@/selection'

class AtxHeadingContent extends Format {
  static blockName = 'atxheading.content'

  static create (muya, text) {
    const content = new AtxHeadingContent(muya, text)

    return content
  }

  constructor (muya, text) {
    super(muya, text)
    this.classList = [...this.classList, 'mu-atxheading-content']
    this.createDomNode()
  }

  update (cursor) {
    return this.inlineRenderer.patch(this, cursor)
  }

  backspaceHandler (event) {
    const { start, end } = Selection.getCursorOffsets(this.domNode)
    if (start.offset === 0 && end.offset === 0) {
      this.text = this.text.replace(/^ {0,3}#{1,6} */, '')
      this.convertToParagraph()
    } else {
      super.backspaceHandler(event)
    }
  }
}

export default AtxHeadingContent
