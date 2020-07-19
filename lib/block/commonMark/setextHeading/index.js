import Parent from '@/block/base/parent'
import ScrollPage from '@/block/scrollPage'
import { mixins } from '@/utils'
import leafQueryBlock from '@/block/mixins/leafQueryBlock'

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

  getState () {
    return {
      name: 'setext-heading',
      meta: this.meta,
      text: this.children.head.text
    }
  }
}

mixins(
  SetextHeading,
  leafQueryBlock
)

export default SetextHeading
