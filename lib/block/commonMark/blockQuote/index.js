import Parent from '@/block/base/parent'
import ScrollPage from '@/block/scrollPage'

class BlockQuote extends Parent {
  static blockName = 'block-quote'

  static create (muya, state) {
    const blockQuote = new BlockQuote(muya, state)

    for (const child of state.children) {
      blockQuote.append(ScrollPage.loadBlock(child.name).create(muya, child))
    }

    return blockQuote
  }

  get path () {
    const { path: pPath } = this.parent
    const offset = this.parent.offset(this)

    return [...pPath, offset, 'children']
  }

  constructor (muya) {
    super(muya)
    this.tagName = 'blockquote'
    this.classList = ['mu-block-quote']
    this.createDomNode()
  }
}

export default BlockQuote
