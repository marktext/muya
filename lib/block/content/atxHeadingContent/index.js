import Format from '@/block/base/format'

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
}

export default AtxHeadingContent
