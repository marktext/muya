import Parent from '@/block/base/parent'
import ScrollPage from '@/block/scrollPage'

class ListItem extends Parent {
  static blockName = 'list-item'

  static create (muya, state) {
    const listItem = new ListItem(muya)

    listItem.append(...state.children.map(child => ScrollPage.loadBlock(child.name).create(muya, child)))

    return listItem
  }

  get path () {
    const { path: pPath } = this.parent
    const offset = this.parent.offset(this)

    return [...pPath, offset, 'children']
  }

  constructor (muya) {
    super(muya)
    this.tagName = 'li'
    this.classList = ['mu-list-item']
    this.createDomNode()
  }

  queryBlock (path) {
    if (path[0] === 'children') {
      path.shift()
    }

    const p = path.shift()
    const block = this.find(p)

    return path.length ? block.queryBlock(path) : block
  }

  getState () {
    const state = {
      name: this.blockName,
      children: this.children.map(child => child.getState())
    }

    return state
  }
}

export default ListItem
