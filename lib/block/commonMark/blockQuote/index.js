import Parent from '@muya/block/base/parent'
import ScrollPage from '@muya/block/scrollPage'
import { mixins } from '@muya/utils'
import containerQueryBlock from '@muya/block/mixins/containerQueryBlock'

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

  getState () {
    const state = {
      name: 'block-quote',
      children: this.children.map(child => child.getState())
    }

    return state
  }
}

mixins(
  BlockQuote,
  containerQueryBlock
)

export default BlockQuote
