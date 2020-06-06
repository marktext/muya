import TreeNode from './treeNode'
import LinkedList from './linkedList'

class Parent extends TreeNode {
  constructor () {
    super()
    this.children = new LinkedList()
  }

  append (...node) {
    node.forEach(node => (node.parent = this))

    return this.children.append(...node)
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
