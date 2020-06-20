import Parent from '@/block/base/parent'

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
    const scrollPage = new ScrollPage(muya)

    scrollPage.append(...state.map(block => {
      return this.loadBlock(block.name).create(muya, block)
    }))

    scrollPage.parent.domNode.appendChild(scrollPage.domNode)

    return scrollPage
  }

  get path () {
    return []
  }

  constructor (muya) {
    super(muya)
    this.parent = muya
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
