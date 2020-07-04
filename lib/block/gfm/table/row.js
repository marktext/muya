import Parent from '@/block/base/parent'
import ScrollPage from '@/block/scrollPage'

class TableRow extends Parent {
  static blockName = 'table.row'

  static create (muya, state, isHeadRow = false) {
    const row = new TableRow(muya, state)

    row.append(...state.children.map(child => ScrollPage.loadBlock(isHeadRow ? 'table.head.cell' : 'table.body.cell').create(muya, child)))

    return row
  }

  get isHeadRow () {
    return this.parent.blockName === 'table.head'
  }

  get path () {
    const { path: pPath } = this.parent
    const offset = this.parent.offset(this)

    return this.isHeadRow ? [...pPath, 0, 'children'] : [...pPath, 1 + offset, 'children']
  }

  constructor (muya) {
    super(muya)
    this.tagName = 'tr'

    this.classList = ['mu-table-row']
    this.createDomNode()
  }

  getState () {
    const state = {
      name: 'row',
      children: this.map(node => node.getState())
    }

    return state
  }
}

export default TableRow
