import Parent from '@muya/block/base/parent'
import ScrollPage from '@muya/block/scrollPage'
import { mixins } from '@muya/utils'
import containerQueryBlock from '@muya/block/mixins/containerQueryBlock'

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

  getState () {
    const state = {
      name: this.blockName,
      children: this.children.map(child => child.getState())
    }

    return state
  }
}

mixins(
  ListItem,
  containerQueryBlock
)

export default ListItem
