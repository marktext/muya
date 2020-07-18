import Parent from '@/block/base/parent'
import ScrollPage from '@/block/scrollPage'

class TaskListItem extends Parent {
  static blockName = 'task-list-item'

  static create (muya, state) {
    const listItem = new TaskListItem(muya, state)

    listItem.appendAttachment(ScrollPage.loadBlock('task-list-checkbox').create(muya, state.meta))
    listItem.append(...state.children.map(child => ScrollPage.loadBlock(child.name).create(muya, child)))

    return listItem
  }

  get path () {
    const { path: pPath } = this.parent
    const offset = this.parent.offset(this)

    return [...pPath, offset, 'children']
  }

  get checked () {
    return this.meta.checked
  }

  set checked (checked) {
    const oldCheckStatus = this.meta.checked
    this.meta.checked = checked
    if (checked !== oldCheckStatus) {
      const { path } = this
      path.pop()
      path.push('meta', 'checked')

      this.jsonState.pushOperation('replaceOp', path, oldCheckStatus, checked)
    }
  }

  constructor (muya, { meta }) {
    super(muya)
    this.tagName = 'li'
    this.meta = meta
    this.classList = ['mu-task-list-item']
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

export default TaskListItem
