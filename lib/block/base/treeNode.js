import LinkedNode from '@/block/base/linkedList/linkedNode'
import LinkedList from '@/block/base/linkedList/linkedList'
import { createDomNode } from '@/utils/dom'
import { BLOCK_DOM_PROPERTY } from '@/config'

class TreeNode extends LinkedNode {
  get static () {
    return this.constructor
  }

  get isContainerBlock () {
    return this.children instanceof LinkedList
  }

  constructor (muya) {
    super()
    this.muya = muya
    this.parent = null
    this.domNode = null
    this.tagName = null
    this.classList = []
    this.attributes = {}
    this.datasets = {}
  }

  /**
   * create domNode
   */
  createDomNode () {
    const { tagName, classList, attributes, datasets } = this

    const domNode = createDomNode(tagName, {
      classList,
      attributes,
      datasets
    })

    domNode[BLOCK_DOM_PROPERTY] = this

    this.domNode = domNode

    return domNode
  }

  /**
   * Remove the current block in the block tree.
   */
  remove () {
    if (!this.parent) return
    this.parent.children.remove(this)
    this.parent = null
    this.domNode.remove()

    return this
  }
}

export default TreeNode
