import Parent from '@/block/base/parent'
import ScrollPage from '@/block/scrollPage'

class OrderList extends Parent {
  static blockName = 'order-list'

  static create (muya, state) {
    const orderList = new OrderList(muya, state)

    orderList.append(...state.children.map(child => ScrollPage.loadBlock(child.name).create(muya, child)))

    return orderList
  }

  get path () {
    const { path: pPath } = this.parent
    const offset = this.parent.offset(this)

    return [...pPath, offset, 'children']
  }

  constructor (muya, { meta }) {
    super(muya)
    this.tagName = 'ol'
    this.meta = meta
    this.attributes = { start: meta.start }
    this.datasets = { delimiter: meta.delimiter }
    this.classList = ['mu-order-list']
    if (!meta.loose) {
      this.classList.push('mu-tight-list')
    }
    this.createDomNode()
  }

  queryBlock (path) {
    if (path[0] === 'children') {
      path.shift()
    }

    if (path.length === 0) {
      return this
    }

    const p = path.shift()
    const block = this.find(p)

    return path.length ? block.queryBlock(path) : block
  }

  getState () {
    const state = {
      name: this.blockName,
      meta: { ...this.meta },
      children: this.children.map(child => child.getState())
    }

    return state
  }
}

export default OrderList
