import Format from '@/block/base/format'

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
}

export default SetextHeadingContent
