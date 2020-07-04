import Format from '@/block/base/format'
// import ScrollPage from '@/block'

class TableCellContent extends Format {
  static blockName = 'table.cell.content'

  static create (muya, text) {
    const content = new TableCellContent(muya, text)

    return content
  }

  constructor (muya, text) {
    super(muya, text)
    this.classList = [...this.classList, 'mu-table-cell-content']
    this.createDomNode()
  }

  update (cursor) {
    return this.inlineRenderer.patch(this, cursor)
  }

  enterHandler (event) {
    // TODO
  }

  backspaceHandler (event) {
    // TODO
  }
}

export default TableCellContent
