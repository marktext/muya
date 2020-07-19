import Parent from '@/block/base/parent'
import ScrollPage from '@/block/scrollPage'
import { mixins } from '@/utils'
import leafQueryBlock from '@/block/mixins/leafQueryBlock'

class TableBodyCell extends Parent {
  static blockName = 'table.cell'

  static create (muya, state) {
    const cell = new TableBodyCell(muya, state)

    cell.append(ScrollPage.loadBlock('table.cell.content').create(muya, state.text))

    return cell
  }

  get path () {
    const { path: pPath } = this.parent
    const offset = this.parent.offset(this)

    return [...pPath, 'children', offset]
  }

  get table () {
    return this.closestBlock('table')
  }

  get row () {
    return this.closestBlock('table.row')
  }

  get rowOffset () {
    return this.table.firstChild.offset(this.row)
  }

  get columnOffset () {
    return this.row.offset(this)
  }

  get align () {
    return this.meta.align
  }

  set align (value) {
    this.domNode.dataset.align = value
    this.meta.align = value
  }

  constructor (muya, { meta }) {
    super(muya)
    this.tagName = 'td'
    this.meta = meta
    this.datasets = {
      align: meta.align
    }
    this.classList = ['mu-table-cell']
    this.createDomNode()
  }

  getState () {
    const state = {
      name: 'table.cell',
      meta: { ...this.meta },
      text: this.firstChild.text
    }

    return state
  }
}

mixins(
  TableBodyCell,
  leafQueryBlock
)

export default TableBodyCell
