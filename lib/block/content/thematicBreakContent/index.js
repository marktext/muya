import Format from '@/block/base/format'
import Selection from '@/selection'

class ThematicBreakContent extends Format {
  static blockName = 'thematicbreak.content'

  static create (muya, text) {
    const content = new ThematicBreakContent(muya, text)

    return content
  }

  constructor (muya, text) {
    super(muya, text)
    this.classList = [...this.classList, 'mu-thematic-break-content']
    this.createDomNode()
  }

  update (cursor) {
    return this.inlineRenderer.patch(this, cursor)
  }

  /**
   * Create an empty paragraph bellow.
   * @param {*} event
   */
  enterHandler (event) {
    const { text } = this
    const offset = text.length
    this.setCursor(offset, offset)
    super.enterHandler(event)
  }

  backspaceHandler (event) {
    const { start, end } = Selection.getCursorOffsets(this.domNode)
    if (start.offset === 0 && end.offset === 0) {
      // Remove the text content and convert it to paragraph
      this.text = ''
      this.convertToParagraph()
    } else {
      super.backspaceHandler(event)
    }
  }
}

export default ThematicBreakContent
