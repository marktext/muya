import Format from '@/block/base/format'

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

  enterHandler (event) {
    super.enterHandler(event)
  }
}

export default ThematicBreakContent
