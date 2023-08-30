import Parent from '@muya/block/base/parent'
import ScrollPage from '@muya/block/scrollPage'

class MathContainer extends Parent {
  static blockName = 'math-container'

  static create (muya, state) {
    const mathContainer = new MathContainer(muya, state)

    const code = ScrollPage.loadBlock('code').create(muya, state)

    mathContainer.append(code)

    return mathContainer
  }

  get lang () {
    return 'latex'
  }

  get path () {
    const { path: pPath } = this.parent

    return [...pPath]
  }

  constructor (muya) {
    super(muya)
    this.tagName = 'pre'
    this.classList = ['mu-math-container']
    this.createDomNode()
  }
}

export default MathContainer
