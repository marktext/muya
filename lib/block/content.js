import TreeNode from '@/block/treeNode'
import logger from '@/utils/logger'

const debug = logger('block.content:')

class Content extends TreeNode {
  static blockName = 'content'

  constructor (muya, parent, state) {
    super(muya, parent)
    this.tagName = 'span'
    this.classList = ['mu-content']
    this.text = state.text
  }

  createDomNodeAndMount () {
    super.createDomNodeAndMount()

    this.update()
  }

  update () {
    const { text } = this
    debug.log(this)
    this.domNode.innerHTML = `<span class="mu-syntax-text">${text}</span>`
  }
}

export default Content
