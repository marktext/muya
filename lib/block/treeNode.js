import LinkedNode from '@/block/linkedNode'
import { createDomNode } from '@/utils/dom'
import { BLOCK_DOM_PROPERTY } from '@/config'

class TreeNode extends LinkedNode {
  get static () {
    return this.constructor
  }

  constructor (muya, parent) {
    super()

    this.muya = muya
    this.parent = parent
    this.domNode = null
    this.tagName = null
    this.classList = []
    this.attributes = {}
    this.datasets = {}
  }

  /**
   * create domNode and append it to its parment's domNode
   */
  createDomNodeAndMount () {
    const { tagName, classList, attributes, datasets } = this
    const domNode = createDomNode(tagName, {
      classList,
      attributes,
      datasets
    })

    domNode[BLOCK_DOM_PROPERTY] = this

    this.parent.domNode.appendChild(domNode)
    this.domNode = domNode
  }

  remove () {
    if (!this.parent) return
    this.parent.children.remove(this)
    this.parent = null

    return this
  }
}

export default TreeNode
