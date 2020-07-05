import Format from '@/block/base/format'
import ScrollPage from '@/block'

class TableCellContent extends Format {
  static blockName = 'table.cell.content'

  static create (muya, text) {
    const content = new TableCellContent(muya, text)

    return content
  }

  get table () {
    return this.closestBlock('table')
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
    const { start } = this.getCursor()
    const previousContentBlock = this.previousContentInContext()
    const offset = previousContentBlock.text.length

    if (start.offset !== 0) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    if (previousContentBlock.blockName !== 'table.cell.content' && this.table.isEmpty) {
      const state = {
        name: 'paragraph',
        text: ''
      }
      const newParagraphBlock = ScrollPage.loadBlock('paragraph').create(this.muya, state)
      this.table.replaceWith(newParagraphBlock)
      newParagraphBlock.firstChild.setCursor(0, 0)
    } else {
      previousContentBlock.setCursor(offset, offset, true)
    }
  }

  tabHandler (event) {
    event.preventDefault()
    event.stopPropagation()

    const nextContentBlock = this.nextContentInContext()

    if (nextContentBlock) {
      nextContentBlock.setCursor(0, 0, true)
    }
  }
}

export default TableCellContent
