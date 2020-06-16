import Parent from '@/block/base/parent'
import ScrollPage from '@/block/scrollPage'

class SetextHeading extends Parent {
  static blockName = 'setext-heading'

  static create (muya, state) {
    const heading = new SetextHeading(muya, state)

    heading.append(ScrollPage.loadBlock('setextheading.content').create(muya, state.text))

    return heading
  }

  get path () {
    const { path: pPath } = this.parent
    const offset = this.parent.offset(this)

    return [...pPath, offset]
  }

  constructor (muya, { meta }) {
    super(muya)
    this.tagName = `h${meta.level}`
    this.meta = meta
    this.classList = ['mu-setext-heading']
    this.createDomNode()
  }
}

export default SetextHeading
