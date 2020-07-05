import Format from '@/block/base/format'
import ScrollPage from '@/block'
import { EVENT_KEYS } from '@/config'

class TableCellContent extends Format {
  static blockName = 'table.cell.content'

  static create (muya, text) {
    const content = new TableCellContent(muya, text)

    return content
  }

  get table () {
    return this.closestBlock('table')
  }

  get row () {
    return this.closestBlock('table.row')
  }

  get cell () {
    return this.closestBlock('table.head.cell') || this.closestBlock('table.body.cell')
  }

  constructor (muya, text) {
    super(muya, text)
    this.classList = [...this.classList, 'mu-table-cell-content']
    this.createDomNode()
  }

  update (cursor) {
    return this.inlineRenderer.patch(this, cursor)
  }

  findNextRow () {
    const { row } = this
    if (row.next) {
      return row.next
    }

    if (row.parent.blockName === 'table.head') {
      if (row.parent.next) {
        return row.parent.next.firstChild
      }

      return null
    }

    return null
  }

  findPreviousRow () {
    const { row } = this
    if (row.prev) {
      return row.prev
    }

    if (row.parent.blockName === 'table.body') {
      return row.parent.prev.firstChild
    }

    return null
  }

  enterHandler (event) {

  }

  arrowHandler (event) {
    const previousRow = this.findPreviousRow()
    const nextRow = this.findNextRow()
    const { table, cell, row } = this
    const offset = row.offset(cell)
    const tablePrevContent = table.prev ? table.prev.lastContentInDescendant() : null
    const tableNextContent = table.next ? table.next.firstContentInDescendant() : null

    if (event.key === EVENT_KEYS.ArrowUp) {
      event.preventDefault()
      if (previousRow) {
        const cursorBlock = previousRow.find(offset).firstContentInDescendant()
        const cursorOffset = cursorBlock.text.length
        cursorBlock.setCursor(cursorOffset, cursorOffset, true)
      } else if (tablePrevContent) {
        const cursorOffset = tablePrevContent.text.length
        tablePrevContent.setCursor(cursorOffset, cursorOffset, true)
      }
    } else if (event.key === EVENT_KEYS.ArrowDown) {
      event.preventDefault()

      if (nextRow) {
        const cursorBlock = nextRow.find(offset).firstContentInDescendant()
        cursorBlock.setCursor(0, 0, true)
      } else {
        let cursorBlock = null
        if (tableNextContent) {
          cursorBlock = tableNextContent
        } else {
          const state = {
            name: 'paragraph',
            text: ''
          }

          const newParagraphBlock = ScrollPage.loadBlock('paragraph').create(this.muya, state)
          this.scrollPage.append(newParagraphBlock, 'user')
          cursorBlock = newParagraphBlock.firstContentInDescendant()
        }

        cursorBlock.setCursor(0, 0, true)
      }
    } else {
      super.arrowHandler(event)
    }
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
