import Parent from '@/block/base/parent'
import ScrollPage from '@/block/scrollPage'

class DiagramBlock extends Parent {
  static blockName = 'diagram'

  static create (muya, state) {
    const diagramBlock = new DiagramBlock(muya, state)

    const diagramPreview = ScrollPage.loadBlock('diagram-preview').create(muya, state)
    const diagramContainer = ScrollPage.loadBlock('diagram-container').create(muya, state)

    diagramBlock.appendAttachment(diagramPreview)
    diagramBlock.append(diagramContainer)

    return diagramBlock
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
    this.classList = ['mu-diagram-block']
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

export default DiagramBlock
