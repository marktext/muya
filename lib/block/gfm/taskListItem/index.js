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

  constructor (muya, { meta }) {
    super(muya)
    this.tagName = 'li'
    this.meta = meta
    this.classList = ['mu-task-list-item']
    this.createDomNode()
  }

  getState () {
    const state = {
      name: this.static.blockName,
      children: this.children.map(child => child.getState())
    }

    return state
  }
}

export default TaskListItem
