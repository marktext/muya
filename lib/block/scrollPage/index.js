import Parent from '@/block/base/parent'

import './index.css'

class ScrollPage extends Parent {
  static blockName = 'scrollpage'

  static blocks = new Map()

  static register (Block) {
    const { blockName } = Block
    this.blocks.set(blockName, Block)
  }

  static loadBlock (blockName) {
    return this.blocks.get(blockName)
  }

  static create (muya, state) {
    const ScollPageBlock = this.loadBlock(state.name) // Yet, it is must be `ScrollPage`
    const scrollPage = new ScollPageBlock(muya)

    scrollPage.append(...state.children.map(block => {
      return this.loadBlock(block.name).create(muya, scrollPage, block)
    }))

    scrollPage.parent.domNode.appendChild(scrollPage.domNode)

    return scrollPage
  }

  get path () {
    return ['children']
  }

  constructor (muya) {
    super(muya, muya)
    this.tagName = 'div'
    this.classList = ['mu-container']
    this.createDomNode()
  }

  /**
   * find the content block by the path
   * @param {array} path
   */
  queryBlock (path) {
    // TODO
  }
}

export default ScrollPage
