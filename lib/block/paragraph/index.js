import Parent from '@/block/base/parent'
import ScrollPage from '@/block/scrollPage'

class Paragraph extends Parent {
  static blockName = 'paragraph'

  static create (muya, parent, state) {
    const paragraph = new Paragraph(muya, parent)

    paragraph.append(...state.children.map(block => {
      return ScrollPage.loadBlock(block.name).create(muya, paragraph, block)
    }))

    return paragraph
  }

  get path () {
    const { path: pPath } = this.parent
    const offset = this.parent.offset(this)

    return [...pPath, offset, 'children']
  }

  constructor (muya, parent) {
    super(muya, parent)
    this.tagName = 'p'
    this.classList = ['mu-paragraph']
    this.createDomNode()
  }
}

export default Paragraph
