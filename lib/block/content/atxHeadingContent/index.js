import Format from '@/block/base/format'
import ScrollPage from '@/block'

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

  getAnchor () {
    return this.parent
  }

  update (cursor, highlights = []) {
    return this.inlineRenderer.patch(this, cursor, highlights)
  }

  enterHandler (event) {
    const { start, end } = this.getCursor()
    const { level } = this.parent.meta

    if (start.offset === end.offset && start.offset <= level + 1) {
      const newNodeState = {
        name: 'paragraph',
        text: ''
      }

      const newParagraphBlock = ScrollPage.loadBlock(newNodeState.name).create(this.muya, newNodeState)
      this.parent.parent.insertBefore(newParagraphBlock, this.parent)
      this.setCursor(start.offset, end.offset, true)
    } else {
      super.enterHandler(event)
    }
  }

  backspaceHandler (event) {
    const { start, end } = this.getCursor()
    if (start.offset === 0 && end.offset === 0) {
      this.text = this.text.replace(/^ {0,3}#{1,6} */, '')
      this.convertToParagraph()
    } else {
      super.backspaceHandler(event)
    }
  }
}

export default AtxHeadingContent
