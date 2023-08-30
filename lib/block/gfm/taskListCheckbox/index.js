import TreeNode from '@muya/block/base/treeNode'
import logger from '@muya/utils/logger'
import { operateClassName } from '@muya/utils/dom'

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
    this.attributes = { type: 'checkbox', contenteditable: 'false' }
    this.classList = ['mu-task-list-checkbox']

    if (checked) {
      this.attributes.checked = true
      this.classList.push('mu-checkbox-checked')
    }

    this.eventIds = []
    this.createDomNode()
    this.listen()
  }

  listen () {
    const { domNode, muya } = this
    const { eventCenter } = muya
    const clickHandler = event => {
      event.stopPropagation()
      const { checked } = event.target
      this.update(checked, 'user')
    }

    const eventIds = [
      eventCenter.attachDOMEvent(domNode, 'click', clickHandler)
    ]

    this.eventIds.push(...eventIds)
  }

  update = (checked, source = 'api') => {
    operateClassName(this.domNode, checked ? 'add' : 'remove', 'mu-checkbox-checked')
    const taskListItem = this.parent
    const taskList = taskListItem.parent

    if (this.domNode.checked !== checked) {
      this.domNode.checked = checked
    }

    if (source === 'api') {
      taskListItem.meta.checked = checked
    } else {
      taskListItem.checked = checked
    }

    taskList.orderIfNecessary()
  }

  detachDOMEvents () {
    for (const id of this.eventIds) {
      this.muya.eventCenter.detachDOMEvent(id)
    }
  }

  remove () {
    this.detachDOMEvents()
    super.remove()
    this.domNode.remove()
    this.domNode = null
  }

  getState () {
    debug.warn('You sholud never call this method.')
  }
}

export default TaskListCheckbox
