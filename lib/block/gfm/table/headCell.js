import Parent from '@/block/base/parent'
import ScrollPage from '@/block/scrollPage'

class TableHeadCell extends Parent {
  static blockName = 'table.head.cell'

  static create (muya, state) {
    const cell = new TableHeadCell(muya, state)

    cell.append(ScrollPage.loadBlock('table.cell.content').create(muya, state.text))

    return cell
  }

  get path () {
    const { path: pPath } = this.parent
    const offset = this.parent.offset(this)

    return [...pPath, offset]
  }

  constructor (muya, { meta }) {
    super(muya)
    this.tagName = 'th'
    this.meta = meta
    this.classList = ['mu-table-head-cell']
    this.createDomNode()
  }

  getState () {
    const state = {
      name: 'cell',
      meta: { ...this.meta },
      text: this.firstChild.text
    }

    return state
  }
}

export default TableHeadCell
