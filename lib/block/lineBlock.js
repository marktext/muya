import TreeNode from './treeNode'

class LineBlock extends TreeNode {
  static create (text) {
    const domNode = document.createElement('span')
    return new LineBlock(domNode, text)
  }
  constructor (domNode, text) {
    this.domNode = domNode
    this.text = text
  }
}

export default LineBlock
