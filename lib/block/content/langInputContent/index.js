import Content from '@/block/base/content'
import { getHighlightHtml } from '@/utils/highlightHTML'

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

  getAnchor () {
    return this.parent
  }

  update (_, highlights = []) {
    this.domNode.innerHTML = getHighlightHtml(this.text, highlights)
  }

  inputHandler () {
    const { start, end } = this.getCursor()
    const textContent = this.domNode.textContent
    const lang = textContent.split(/\s+/)[0]
    this.text = lang
    this.parent.lang = lang
    const startOffset = Math.min(lang.length, start.offset)
    const endOffset = Math.min(lang.length, end.offset)

    this.setCursor(startOffset, endOffset, true)
    // Show code picker
    if (lang) {
      const reference = this.domNode
      this.muya.eventCenter.emit('muya-code-picker', {
        reference,
        block: this.parent,
        lang
      })
    } else {
      this.muya.eventCenter.emit('muya-code-picker', { reference: null })
    }
  }

  enterHandler (event) {
    event.preventDefault()
    event.stopPropagation()

    const { parent } = this
    parent.lastContentInDescendant().setCursor(0, 0)
  }

  backspaceHandler () {
    const { start } = this.getCursor()
    if (start.offset === 0) {
      const cursorBlock = this.previousContentInContext()
      const offset = cursorBlock.text.length
      cursorBlock.setCursor(offset, offset, true)
    }
  }
}

export default LangInputContent
