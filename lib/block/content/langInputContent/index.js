import Content from '@/block/base/content'

class LangInputContent extends Content {
  static blockName = 'language-input'

  static create (muya, state) {
    const content = new LangInputContent(muya, state)

    return content
  }

  constructor (muya, { meta }) {
    super(muya, meta.lang)
    this.classList = [...this.classList, 'mu-language-input']
    this.createDomNode()
  }

  update () {
    this.domNode.innerHTML = this.text
  }

  enterHandler (event) {
    // TODO
  }

  backspaceHandler (event) {
    // TODO
  }
}

export default LangInputContent
