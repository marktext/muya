import TreeNode from '@/block/base/treeNode'
import LinkedList from '@/block/linkedList/linkedList'

class Parent extends TreeNode {
  constructor (muya, parent) {
    super(muya, parent)
    this.children = new LinkedList()
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
}

export default Parent
