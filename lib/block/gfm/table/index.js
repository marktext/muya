import Parent from '@/block/base/parent'
import ScrollPage from '@/block/scrollPage'

class Table extends Parent {
  static blockName = 'table'

  static create (muya, state) {
    const table = new Table(muya, state)

    table.append(ScrollPage.loadBlock('table.inner').create(muya, state))

    return table
  }

  static createWithRowAndColumn (muya, row, column) {
    // TODO
  }

  static createWithHeader (muya, header) {
    // TODO
  }

  get path () {
    const { path: pPath } = this.parent
    const offset = this.parent.offset(this)

    return [...pPath, offset]
  }

  get isEmpty () {
    const state = this.getState()
    console.log(state)

    return state.children.every(row => row.children.every(cell => cell.text === ''))
  }

  get rowCount () {
    return this.firstChild.length()
  }

  get columnCount () {
    return this.firstChild.firstChild.length()
  }

  constructor (muya) {
    super(muya)
    this.tagName = 'figure'

    this.classList = ['mu-table']
    this.createDomNode()
  }

  insertRow (offset) {
    const { columnCount } = this
    const firstRowState = this.getState().children[0]
    const currentRow = offset > 0 ? this.firstChild.find(offset - 1) : this.firstChild.find(offset)
    const state = {
      name: 'table.row',
      children: [...new Array(columnCount)].map((_, i) => {
        return {
          name: 'table.cell',
          meta: {
            align: firstRowState.children[i].meta.align
          },
          text: ''
        }
      })
    }

    const rowBlock = ScrollPage.loadBlock('table.row').create(this.muya, state)

    if (offset > 0) {
      this.firstChild.insertAfter(rowBlock, currentRow)
    } else {
      this.firstChild.insertBefore(rowBlock, currentRow)
    }

    return rowBlock.firstContentInDescendant()
  }

  insertColumn (offset) {
    // TODO
  }

  removeRow (offset) {
    // TODO
  }

  removeColumn (offset) {
    // TODO
  }

  getState () {
    return this.firstChild.getState()
  }
}

export default Table
