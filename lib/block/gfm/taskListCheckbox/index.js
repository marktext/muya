import TreeNode from '@/block/base/treeNode'
import logger from '@/utils/logger'
import { operateClassName } from '@/utils/dom'

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
    this.attributes = { type: 'checkbox' }
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
      const { checked } = event.target
      operateClassName(this.domNode, checked ? 'add' : 'remove', 'mu-checkbox-checked')
      this.parent.checked = checked
    }

    const eventIds = [
      eventCenter.attachDOMEvent(domNode, 'input', clickHandler)
    ]

    this.eventIds.push(...eventIds)
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
