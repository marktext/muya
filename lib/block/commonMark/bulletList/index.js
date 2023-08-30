import Parent from '@muya/block/base/parent'
import ScrollPage from '@muya/block/scrollPage'
import { mixins } from '@muya/utils'
import containerQueryBlock from '@muya/block/mixins/containerQueryBlock'

class BulletList extends Parent {
  static blockName = 'bullet-list'

  static create (muya, state) {
    const bulletList = new BulletList(muya, state)

    bulletList.append(...state.children.map(child => ScrollPage.loadBlock(child.name).create(muya, child)))

    return bulletList
  }

  get path () {
    const { path: pPath } = this.parent
    const offset = this.parent.offset(this)

    return [...pPath, offset, 'children']
  }

  constructor (muya, { meta }) {
    super(muya)
    this.tagName = 'ul'
    this.meta = meta
    this.datasets = {
      marker: meta.marker
    }
    this.classList = ['mu-bullet-list']
    if (!meta.loose) {
      this.classList.push('mu-tight-list')
    }
    this.createDomNode()
  }

  getState () {
    const state = {
      name: this.blockName,
      meta: { ...this.meta },
      children: this.children.map(child => child.getState())
    }

    return state
  }
}

mixins(
  BulletList,
  containerQueryBlock
)

export default BulletList
