import Format from '@/block/base/format'
import Selection from '@/selection'

class SetextHeadingContent extends Format {
  static blockName = 'setextheading.content'

  static create (muya, text) {
    const content = new SetextHeadingContent(muya, text)

    return content
  }

  constructor (muya, text) {
    super(muya, text)
    this.classList = [...this.classList, 'mu-setextheading-content']
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
      this.convertToParagraph()
    } else {
      super.backspaceHandler(event)
    }
  }
}

export default SetextHeadingContent
