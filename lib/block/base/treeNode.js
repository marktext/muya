import LinkedNode from '@/block/linkedList/linkedNode'
import LinkedList from '@/block/linkedList/linkedList'
import { createDomNode } from '@/utils/dom'
import { BLOCK_DOM_PROPERTY } from '@/config'

class TreeNode extends LinkedNode {
  get static () {
    return this.constructor
  }

  get isContainerBlock () {
    return this.children instanceof LinkedList
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

  remove () {
    if (!this.parent) return
    this.parent.children.remove(this)
    this.parent = null

    return this
  }
}

export default TreeNode
