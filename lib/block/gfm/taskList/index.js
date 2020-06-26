import Parent from '@/block/base/parent'
import ScrollPage from '@/block/scrollPage'

class TaskList extends Parent {
  static blockName = 'task-list'

  static create (muya, state) {
    const taskList = new TaskList(muya, state)

    taskList.append(...state.children.map(child => ScrollPage.loadBlock(child.name).create(muya, child)))

    return taskList
  }

  get path () {
    const { path: pPath } = this.parent
    const offset = this.parent.offset(this)

    return [...pPath, offset, 'children']
  }

  constructor (muya, { meta }) {
    super(muya)
    this.tagName = 'ul'
    this.meta = meta
    this.classList = ['mu-task-list']
    this.createDomNode()
  }

  getState () {
    const state = {
      name: this.static.blockName,
      meta: { ...this.mata },
      children: this.children.map(child => child.getState())
    }

    return state
  }
}

export default TaskList
