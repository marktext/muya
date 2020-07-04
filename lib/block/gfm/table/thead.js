import Parent from '@/block/base/parent'
import ScrollPage from '@/block/scrollPage'

class TableHead extends Parent {
  static blockName = 'table.head'

  static create (muya, state) {
    const head = new TableHead(muya)

    head.append(ScrollPage.loadBlock('table.row').create(muya, state, true))

    return head
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
    return this.firstChild.getState()
  }
}

export default TableHead
