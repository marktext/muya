import Parent from '@muya/block/base/parent'
import ScrollPage from '@muya/block/scrollPage'

class DiagramContainer extends Parent {
  static blockName = 'diagram-container'

  static create (muya, state) {
    const diagramContainer = new DiagramContainer(muya, state)

    const code = ScrollPage.loadBlock('code').create(muya, state)

    diagramContainer.append(code)

    return diagramContainer
  }

  get lang () {
    return this.meta.lang
  }

  get path () {
    const { path: pPath } = this.parent

    return [...pPath]
  }

  constructor (muya, { meta }) {
    super(muya)
    this.tagName = 'pre'
    this.meta = meta
    this.classList = ['mu-diagram-container']
    this.createDomNode()
  }
}

export default DiagramContainer
