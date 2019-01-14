import TreeNode from './treeNode'
import logger from '../utils/logger'

const debug = logger('block')

class LineBlock extends TreeNode {
  static create (text) {
    const el = document.createElement('span')
    return new LineBlock(el, text)
  }
  constructor (el, text) {
    super()
    this.el = el
    this.text = text
    this.type = 'line'
    this.name = null
    this.data = {}
  }
  render () {
    if (!this.parent) {
      debug.warn('A line block must need to has a parent before it render.')
    }
  }
}

export default LineBlock
