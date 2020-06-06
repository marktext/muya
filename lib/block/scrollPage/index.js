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

    scrollPage.createDomNodeAndMount()

    scrollPage.append(...state.children.map(block => {
      return this.loadBlock(block.name).create(muya, scrollPage, block)
    }))

    return scrollPage
  }

  constructor (muya) {
    super(muya, muya)
    this.tagName = 'div'
    this.classList = ['mu-container']
  }
}

export default ScrollPage
