import Parent from '@/block/base/parent'
import ScrollPage from '@/block/scrollPage'

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
    this.classList = ['mu-bullet-list']
    this.createDomNode()
  }

  getState () {
    const state = {
      name: this.static.blockName,
      children: this.children.map(child => child.getState())
    }

    return state
  }
}

export default BulletList
