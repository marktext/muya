import Parent from '@/block/base/parent'
import ScrollPage from '@/block/scrollPage'
import logger from '@/utils/logger'

const debug = logger('table:')

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
    const state = {
      name: 'table',
      children: [
        {
          name: 'table.row',
          children: header.map(c => ({
            name: 'table.cell',
            meta: { align: 'none' },
            text: c
          }))
        },
        {
          name: 'table.row',
          children: header.map(_ => ({
            name: 'table.cell',
            meta: { align: 'none' },
            text: ''
          }))
        }
      ]
    }

    return this.create(muya, state)
  }

  get path () {
    const { path: pPath } = this.parent
    const offset = this.parent.offset(this)

    return [...pPath, offset]
  }

  get isEmpty () {
    const state = this.getState()

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

  queryBlock (path) {
    return this.firstChild.queryBlock(path)
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

  insertColumn (offset, align = 'none') {
    const tableInner = this.firstChild
    let firstCellInNewColumn = null
    tableInner.forEach(row => {
      const state = {
        name: 'table.cell',
        meta: { align },
        text: ''
      }
      const cell = ScrollPage.loadBlock('table.cell').create(this.muya, state)
      const ref = row.find(offset)
      row.insertBefore(cell, ref)
      if (!firstCellInNewColumn) {
        firstCellInNewColumn = cell
      }
    })

    return firstCellInNewColumn.firstChild
  }

  removeRow (offset) {
    const row = this.firstChild.find(offset)
    row.remove()
  }

  removeColumn (offset) {
    const { columnCount } = this
    if (offset < 0 || offset >= columnCount) {
      debug.warn(`column at ${offset} is not existed.`)
    }

    const table = this.firstChild
    if (this.columnCount === 1) {
      return this.remove()
    }

    table.forEach(row => {
      const cell = row.find(offset)
      if (cell) {
        cell.remove()
      }
    })
  }

  alignColumn (offset, value) {
    const { columnCount } = this
    if (offset < 0 || offset >= columnCount) {
      debug.warn(`column at ${offset} is not existed.`)
    }

    const table = this.firstChild
    table.forEach(row => {
      const cell = row.find(offset)
      if (cell) {
        cell.align = cell.align === value ? 'none' : value
      }
    })
  }

  getState () {
    return this.firstChild.getState()
  }
}

export default Table
