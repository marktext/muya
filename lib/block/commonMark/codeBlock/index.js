import Parent from '@/block/base/parent'
import ScrollPage from '@/block/scrollPage'

class CodeBlock extends Parent {
  static blockName = 'code-block'

  static create (muya, state) {
    const codeBlock = new CodeBlock(muya, state)

    const langInput = ScrollPage.loadBlock('language-input').create(muya, state)
    const code = ScrollPage.loadBlock('code').create(muya, state)

    codeBlock.append(langInput)
    codeBlock.append(code)

    return codeBlock
  }

  get path () {
    const { path: pPath } = this.parent
    const offset = this.parent.offset(this)

    return [...pPath, offset]
  }

  constructor (muya, { meta }) {
    super(muya)
    this.tagName = 'pre'
    this.meta = meta
    this.classList = ['mu-code-block']
    this.createDomNode()
  }

  getState () {
    const state = {
      name: 'code-block',
      meta: this.meta,
      text: this.lastContentInDescendant().text
    }

    return state
  }
}

export default CodeBlock
