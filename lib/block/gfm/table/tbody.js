import Parent from '@/block/base/parent'
import ScrollPage from '@/block/scrollPage'

class TableBody extends Parent {
  static blockName = 'table.body'

  static create (muya, state) {
    const body = new TableBody(muya)

    body.append(...state.map(s => ScrollPage.loadBlock('table.row').create(muya, s, false)))

    return body
  }

  get path () {
    return this.parent.path
  }

  constructor (muya) {
    super(muya)
    this.tagName = 'thead'

    this.classList = ['mu-table-head']
    this.createDomNode()
  }

  getState () {
    return this.map(node => node.getState())
  }
}

export default TableBody
