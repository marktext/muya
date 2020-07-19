import Parent from '@/block/base/parent'
import logger from '@/utils/logger'

const debug = logger('scrollpage:')

class ScrollPage extends Parent {
  static blockName = 'scrollpage'

  static blocks = new Map()

  static register (Block) {
    const { blockName } = Block
    this.blocks.set(blockName, Block)
  }

  static loadBlock (blockName) {
    const block = this.blocks.get(blockName)
    if (!block) {
      debug.warn(`block:${blockName} is not existed.`)
    }

    return block
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
    this.blurFocus = {
      blur: null,
      focus: null
    }
    this.createDomNode()
  }

  /**
   * Find the content block by the path
   * @param {array} path
   */
  queryBlock (path) {
    if (path.length === 0) {
      return this
    }

    const p = path.shift()
    const block = this.find(p)

    return block && path.length ? block.queryBlock(path) : block
  }

  updateRefLinkAndImage (label) {
    const REG = new RegExp(`\\[${label}\\](?!:)`)

    this.breadthFirstTraverse(node => {
      if (node.isContentBlock && REG.test(node.text)) {
        node.update()
      }
    })
  }

  handleBlurFromContent (block) {
    this.blurFocus.blur = block
    requestAnimationFrame(this.updateActiveStatus)
  }

  handleFocusFromContent (block) {
    this.blurFocus.focus = block
    requestAnimationFrame(this.updateActiveStatus)
  }

  updateActiveStatus = () => {
    const { blur, focus } = this.blurFocus

    if (!blur && !focus) {
      return
    }

    let needBlurBlocks = []
    let needFocusBlocks = []
    let block

    if (blur && focus) {
      needFocusBlocks = focus.getAncestors()
      block = blur.parent
      while (block && block.isLeafBlock && !needFocusBlocks.includes(block)) {
        needBlurBlocks.push(block)
        block = block.parent
      }
    } else if (blur) {
      needBlurBlocks = blur.getAncestors()
    } else if (focus) {
      needFocusBlocks = focus.getAncestors()
    }

    if (needBlurBlocks.length) {
      needBlurBlocks.forEach(b => {
        b.active = false
      })
    }

    if (needFocusBlocks.length) {
      needFocusBlocks.forEach(b => {
        b.active = true
      })
    }

    this.blurFocus = {
      blur: null,
      focus: null
    }
  }
}

export default ScrollPage
