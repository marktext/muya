import Parent from '@/block/base/parent'
import ScrollPage from '@/block/scrollPage'

class Table extends Parent {
  static blockName = 'table'

  static create (muya, state) {
    const table = new Table(muya, state)

    table.append(ScrollPage.loadBlock('table.inner').create(muya, state))

    return table
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

  constructor (muya) {
    super(muya)
    this.tagName = 'figure'

    this.classList = ['mu-table']
    this.createDomNode()
  }

  getState () {
    return this.firstChild.getState()
  }
}

export default Table
