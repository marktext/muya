import Parent from '@/block/base/parent'
import ScrollPage from '@/block/scrollPage'

class AtxHeading extends Parent {
  static blockName = 'atx-heading'

  static create (muya, parent, state) {
    const heading = new AtxHeading(muya, parent, state)

    heading.append(ScrollPage.loadBlock('paragraph.content').create(muya, heading, state.text))

    return heading
  }

  get path () {
    const { path: pPath } = this.parent
    const offset = this.parent.offset(this)

    return [...pPath, offset]
  }

  constructor (muya, parent, { meta }) {
    super(muya, parent)
    this.tagName = `h${meta.level}`
    this.meta = meta
    this.classList = ['mu-atx-heading']
    this.createDomNode()
  }
}

export default AtxHeading
