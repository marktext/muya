import Parent from '@muya/block/base/parent'
import ScrollPage from '@muya/block/scrollPage'
import { mixins } from '@muya/utils'
import containerQueryBlock from '@muya/block/mixins/containerQueryBlock'

class TableInner extends Parent {
  static blockName = 'table.inner'

  static create (muya, state) {
    const table = new TableInner(muya, state)

    table.append(...state.children.map(child => ScrollPage.loadBlock('table.row').create(muya, child)))

    return table
  }

  get path () {
    return [...this.parent.path, 'children']
  }

  constructor (muya) {
    super(muya)
    this.tagName = 'table'

    this.classList = ['mu-table-inner']
    this.createDomNode()
  }

  getState () {
    const state = {
      name: 'table',
      children: this.map(node => node.getState())
    }

    return state
  }
}

mixins(
  TableInner,
  containerQueryBlock
)

export default TableInner
