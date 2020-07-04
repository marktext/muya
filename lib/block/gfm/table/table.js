import Parent from '@/block/base/parent'
import ScrollPage from '@/block/scrollPage'

class TableInner extends Parent {
  static blockName = 'table.inner'

  static create (muya, state) {
    const table = new TableInner(muya, state)
    const [head, ...body] = state.children

    if (head) {
      table.append(ScrollPage.loadBlock('table.head').create(muya, head))
    }

    if (body && body.length) {
      table.append(ScrollPage.loadBlock('table.body').create(muya, body))
    }

    return table
  }

  get path () {
    return this.parent.path
  }

  constructor (muya) {
    super(muya)
    this.tagName = 'table'

    this.classList = ['mu-table-inner']
    this.createDomNode()
  }

  getState () {
    const state = {
      name: 'table',
      chileren: [
        this.firstChild.getState(),
        ...this.lastChild.getState()
      ]
    }

    return state
  }
}

export default TableInner
