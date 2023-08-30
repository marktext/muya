import Parent from '@muya/block/base/parent'
import ScrollPage from '@muya/block/scrollPage'
import { mixins } from '@muya/utils'
import leafQueryBlock from '@muya/block/mixins/leafQueryBlock'

class AtxHeading extends Parent {
  static blockName = 'atx-heading'

  static create (muya, state) {
    const heading = new AtxHeading(muya, state)

    heading.append(ScrollPage.loadBlock('atxheading.content').create(muya, state.text))

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
    this.classList = ['mu-atx-heading']
    this.createDomNode()
  }

  getState () {
    return {
      name: 'atx-heading',
      meta: this.meta,
      text: this.children.head.text
    }
  }
}

mixins(
  AtxHeading,
  leafQueryBlock
)

export default AtxHeading
