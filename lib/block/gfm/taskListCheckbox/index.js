import TreeNode from '@/block/base/treeNode'
import logger from '@/utils/logger'

const debug = logger('tasklistcheckbox:')

class TaskListCheckbox extends TreeNode {
  static blockName = 'task-list-checkbox'

  static create (muya, meta) {
    const checkbox = new TaskListCheckbox(muya, meta)

    return checkbox
  }

  get path () {
    const { path: pPath } = this.parent
    pPath.pop() // pop `children`

    return [...pPath, 'meta', 'checked']
  }

  constructor (muya, { checked }) {
    super(muya)
    this.tagName = 'input'
    this.checked = checked
    this.attributes = { checked, type: 'checkbox' }
    this.classList = ['mu-task-list-checkbox']
    if (checked) {
      this.classList.push('mu-checkbox-checked')
    }
    this.createDomNode()
  }

  getState () {
    debug.warn('You sholud never call this method.')
  }
}

export default TaskListCheckbox
