import Parent from '@/block/base/parent'
import ScrollPage from '@/block/scrollPage'

class Paragraph extends Parent {
  static blockName = 'paragraph'

  static create (muya, state) {
    const paragraph = new Paragraph(muya)

    paragraph.append(ScrollPage.loadBlock('paragraph.content').create(muya, state.text))

    return paragraph
  }

  get path () {
    const { path: pPath } = this.parent
    const offset = this.parent.offset(this)

    return [...pPath, offset]
  }

  constructor (muya) {
    super(muya)
    this.tagName = 'p'
    this.classList = ['mu-paragraph']
    this.createDomNode()
  }

  queryBlock (path) {
    return path.length && path[0] === 'text' ? this.firstChild : this
  }

  getState () {
    return {
      name: 'paragraph',
      text: this.children.head.text
    }
  }
}

export default Paragraph
