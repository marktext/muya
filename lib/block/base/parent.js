import TreeNode from '@/block/base/treeNode'
import LinkedList from '@/block/base/linkedList/linkedList'
import { operateClassName } from '@/utils/dom'
import { CLASS_NAMES } from '@/config'

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

  append (...nodes) {
    nodes.forEach(node => {
      node.parent = this
      const { domNode } = node
      this.domNode.appendChild(domNode)
    })

    return this.children.append(...nodes)
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
   * find the first leaf block, paragraph.content etc.
   */
  findFirstLeafBlock () {
    let firstLeafBlock = this
    do {
      firstLeafBlock = firstLeafBlock.children.head
    } while (firstLeafBlock.children)

    return firstLeafBlock
  }
}

export default Parent
