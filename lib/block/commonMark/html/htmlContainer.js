import Parent from '@muya/block/base/parent'
import ScrollPage from '@muya/block/scrollPage'

class HTMLContainer extends Parent {
  static blockName = 'html-container'

  static create (muya, state) {
    const htmlContainer = new HTMLContainer(muya, state)

    const code = ScrollPage.loadBlock('code').create(muya, state)

    htmlContainer.append(code)

    return htmlContainer
  }

  get lang () {
    return 'markup'
  }

  get path () {
    const { path: pPath } = this.parent

    return [...pPath]
  }

  constructor (muya) {
    super(muya)
    this.tagName = 'pre'
    this.classList = ['mu-html-container']
    this.createDomNode()
  }
}

export default HTMLContainer
