import Format from '@/block/base/format'

class AtxHeadingContent extends Format {
  static blockName = 'atxheading.content'

  static create (muya, parent, text) {
    const content = new AtxHeadingContent(muya, parent, text)

    return content
  }

  constructor (muya, parent, text) {
    super(muya, parent, text)
    this.classList = [...this.classList, 'mu-atxheading-content']
    this.createDomNode()
  }

  update (cursor) {
    return this.inlineRenderer.patch(this, cursor)
  }
}

export default AtxHeadingContent
