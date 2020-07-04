import Parent from '@/block/base/parent'
import ScrollPage from '@/block/scrollPage'

class TableBodyCell extends Parent {
  static blockName = 'table.body.cell'

  static create (muya, state) {
    const cell = new TableBodyCell(muya, state)

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
    this.tagName = 'td'
    this.meta = meta
    this.classList = ['mu-table-body-cell']
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

export default TableBodyCell
