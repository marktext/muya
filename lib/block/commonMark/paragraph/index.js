import Parent from '@/block/base/parent'
import ScrollPage from '@/block/scrollPage'
import { mixins } from '@/utils'
import leafQueryBlock from '@/block/mixins/leafQueryBlock'

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

  getState () {
    return {
      name: 'paragraph',
      text: this.children.head.text
    }
  }
}

mixins(
  Paragraph,
  leafQueryBlock
)

export default Paragraph
