import Parent from '@/block/base/parent'
import ScrollPage from '@/block/scrollPage'

class TableRow extends Parent {
  static blockName = 'table.row'

  static create (muya, state) {
    const row = new TableRow(muya)

    row.append(...state.children.map(child => ScrollPage.loadBlock('table.cell').create(muya, child)))

    return row
  }

  get path () {
    const { path: pPath } = this.parent
    const offset = this.parent.offset(this)

    return [...pPath, offset]
  }

  constructor (muya) {
    super(muya)
    this.tagName = 'tr'

    this.classList = ['mu-table-row']
    this.createDomNode()
  }

  queryBlock (path) {
    if (path[0] === 'children') {
      path.shift()
    }

    if (path.length === 0) {
      return this
    }

    const p = path.shift()
    const block = this.find(p)

    return path.length ? block.queryBlock(path) : block
  }

  getState () {
    const state = {
      name: 'table.row',
      children: this.map(node => node.getState())
    }

    return state
  }
}

export default TableRow
