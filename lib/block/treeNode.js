import LinkedNode from './linkedNode'

class TreeNode extends LinkedNode {
  constructor () {
    super()
    this.parent = null
  }

  remove () {
    if (!this.parent) return
    this.parent.children.remove(this)
    this.parent = null

    return this
  }
}

export default TreeNode
