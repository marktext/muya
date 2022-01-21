import Parent from '@/block/base/parent'
import ScrollPage from '@/block/scrollPage'

class DiagramContainer extends Parent {
  static blockName = 'diagram-container'

  static create (muya, state) {
    const diagramContainer = new DiagramContainer(muya, state)

    const code = ScrollPage.loadBlock('code').create(muya, state)

    diagramContainer.append(code)

    return diagramContainer
  }

  get lang () {
    return 'yaml'
  }

  get path () {
    const { path: pPath } = this.parent

    return [...pPath]
  }

  constructor (muya) {
    super(muya)
    this.tagName = 'pre'
    this.classList = ['mu-diagram-container']
    this.createDomNode()
  }
}

export default DiagramContainer
