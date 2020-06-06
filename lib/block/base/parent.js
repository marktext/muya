import TreeNode from '@/block/base/treeNode'
import LinkedList from '@/block/linkedList/linkedList'

class Parent extends TreeNode {
  constructor (muya, parent) {
    super(muya, parent)
    this.children = new LinkedList()
  }

  append (...nodes) {
    console.log(nodes)
    nodes.forEach(node => (node.parent = this))

    return this.children.append(...nodes)
  }

  insertBefore (newNode, refNode) {
    newNode.parent = this
    this.children.insertBefore(newNode, refNode)

    return newNode
  }

  insertAfter (newNode, refNode) {
    newNode.parent = this
    this.children.insertBefore(newNode, refNode.next)

    return newNode
  }

  removeChild (node) {
    this.children.remove(node)
    node.parent = null

    return node
  }
}

export default Parent
