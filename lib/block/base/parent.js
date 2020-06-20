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
    this.children = new LinkedList()
    this._active = false
  }

  /**
   * Clone itself.
   */
  clone () {
    const state = this.getState()
    const { muya } = this

    return this.static.create(muya, state)
  }

  append (...nodes) {
    nodes.forEach(node => {
      node.parent = this
      const { domNode } = node
      this.domNode.appendChild(domNode)
    })

    return this.children.append(...nodes)
  }

  /**
   * Use the `block` to replace the current block(this)
   * @param {TreeNode} block
   */
  replaceWith (block) {
    if (!this.parent) {
      debug.warn('Call replaceWith need has a parent block')

      return
    }

    this.parent.insertBefore(block, this)
    block.parent = this.parent
    this.remove()

    return block
  }

  insertBefore (newNode, refNode) {
    newNode.parent = this
    this.children.insertBefore(newNode, refNode)
    this.domNode.insertBefore(newNode.domNode, refNode ? refNode.domNode : null)

    return newNode
  }

  insertAfter (newNode, refNode) {
    this.insertBefore(newNode, refNode.next)

    return newNode
  }

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
