import TreeNode from '@/block/base/treeNode'
import LinkedList from '@/block/base/linkedList/linkedList'
import { operateClassName } from '@/utils/dom'
import { CLASS_NAMES } from '@/config'
import logger from '@/utils/logger'

const debug = logger('parent:')

class Parent extends TreeNode {
  get active () {
    return this._active
  }

  set active (value) {
    this._active = value
    if (value) {
      operateClassName(this.domNode, 'add', CLASS_NAMES.MU_ACTIVE)
    } else {
      operateClassName(this.domNode, 'remove', CLASS_NAMES.MU_ACTIVE)
    }
  }

  constructor (muya) {
    super(muya)
    // Used to store icon, checkbox etc. these blocks are not in children properties in json state.
    this.attachments = new LinkedList()
    this.children = new LinkedList()
    this._active = false
  }

  getJsonPath () {
    const { path } = this
    if (this.isContainerBlock) {
      path.pop()
    }

    return path
  }

  /**
   * Clone itself.
   */
  clone () {
    const state = this.getState()
    const { muya } = this

    return this.static.create(muya, state)
  }

  /**
   * Append node in linkedList, mounted it into the DOM tree, dispatch operation if necessary.
   * @param  {...any} args
   */
  append (...args) {
    const source = typeof args[args.length - 1] === 'string' ? args.pop() : 'api'

    args.forEach(node => {
      node.parent = this
      const { domNode } = node
      this.domNode.appendChild(domNode)
    })

    this.children.append(...args)

    // push operations
    if (source === 'user') {
      args.forEach(node => {
        const path = node.getJsonPath()
        const state = node.getState()
        this.jsonState.pushOperation('insertOp', path, state)
      })
    }
  }

  /**
   * This method will only be used when initialization.
   * @param  {...any} nodes attachment blocks
   */
  appendAttachment (...nodes) {
    nodes.forEach(node => {
      node.parent = this
      const { domNode } = node
      this.domNode.appendChild(domNode)
    })

    this.attachments.append(...nodes)
  }

  forEachAt (index, length, callback) {
    return this.children.forEachAt(index, length, callback)
  }

  forEach (callback) {
    return this.children.forEach(callback)
  }

  /**
   * Use the `block` to replace the current block(this)
   * @param {TreeNode} block
   */
  replaceWith (block, source = 'user') {
    if (!this.parent) {
      debug.warn('Call replaceWith need has a parent block')

      return
    }

    this.parent.insertBefore(block, this, source)
    block.parent = this.parent
    this.remove(source)

    return block
  }

  insertBefore (newNode, refNode, source = 'user') {
    newNode.parent = this
    this.children.insertBefore(newNode, refNode)
    this.domNode.insertBefore(newNode.domNode, refNode ? refNode.domNode : null)

    if (source === 'user') {
      // dispatch json1 operation
      const path = newNode.getJsonPath()
      const state = newNode.getState()
      this.jsonState.pushOperation('insertOp', path, state)
    }

    return newNode
  }

  insertAfter (newNode, refNode, source = 'user') {
    this.insertBefore(newNode, refNode.next, source)

    return newNode
  }

  remove (source = 'user') {
    if (source === 'user') {
      // dispatch json1 operation
      const path = this.getJsonPath()
      const state = this.getState()
      this.jsonState.pushOperation('removeOp', path, state)
    }
    super.remove()
  }

  // TODO: need test....
  removeChild (node) {
    this.children.remove(node)
    node.parent = null

    return node
  }

  offset (node) {
    return this.children.offset(node)
  }

  /**
   * find the first content block, paragraph.content etc.
   */
  firstContentInDescendant () {
    let firstContentBlock = this
    do {
      firstContentBlock = firstContentBlock.children.head
    } while (firstContentBlock.children)

    return firstContentBlock
  }

  /**
   * find the last content block in container block.
   */
  lastContentInDescendant () {
    let lastContentBlock = this

    do {
      lastContentBlock = lastContentBlock.children.tail
    } while (lastContentBlock.children)

    return lastContentBlock
  }
}

export default Parent
