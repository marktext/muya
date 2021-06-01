import Parent from '@/block/base/parent'
import ScrollPage from '@/block/scrollPage'

class MathBlock extends Parent {
  static blockName = 'math-block'

  static create (muya, state) {
    const mathBlock = new MathBlock(muya, state)

    const mathPreview = ScrollPage.loadBlock('math-preview').create(muya, state)
    const mathContainer = ScrollPage.loadBlock('math-container').create(muya, state)

    mathBlock.appendAttachment(mathPreview)
    mathBlock.append(mathContainer)

    return mathBlock
  }

  get path () {
    const { path: pPath } = this.parent
    const offset = this.parent.offset(this)

    return [...pPath, offset]
  }

  constructor (muya, { meta }) {
    super(muya)
    this.tagName = 'figure'
    this.meta = meta
    this.classList = ['mu-math-block']
    this.createDomNode()
  }

  queryBlock (path) {
    return path.length && path[0] === 'text' ? this.firstContentInDescendant() : this
  }

  getState () {
    const { meta, blockName: name } = this
    const { text } = this.firstContentInDescendant()

    return {
      name,
      text,
      meta
    }
  }
}

export default MathBlock
