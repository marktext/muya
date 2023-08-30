import katex from 'katex/dist/katex.js'
import 'katex/dist/contrib/mhchem.min.js'
import Parent from '@muya/block/base/parent'

class MathPreview extends Parent {
  static blockName = 'math-preview'

  static create (muya, state) {
    const mathBlock = new MathPreview(muya, state)

    return mathBlock
  }

  constructor (muya, { text }) {
    super(muya)
    this.tagName = 'div'
    this.math = text
    this.classList = ['mu-math-preview']
    this.attributes = {
      spellcheck: 'false',
      contenteditable: 'false'
    }
    this.createDomNode()
    this.attachDOMEvents()
    this.update()
  }

  attachDOMEvents () {
    const { eventCenter } = this.muya

    eventCenter.attachDOMEvent(this.domNode, 'click', this.clickHandler.bind(this))
  }

  clickHandler (event) {
    console.log(event)
    event.preventDefault()
    event.stopPropagation()

    const cursorBlock = this.parent.firstContentInDescendant()
    cursorBlock.setCursor(0, 0)
  }

  update (math = this.math) {
    if (this.math !== math) {
      this.math = math
    }

    const { i18n } = this.muya

    if (math) {
      try {
        const html = katex.renderToString(math, {
          displayMode: true
        })
        this.domNode.innerHTML = html
      } catch (err) {
        this.domNode.innerHTML = `<div class="mu-math-error">&lt; ${i18n.t('Invalid Mathematical Formula')} &gt;</div>`
      }
    } else {
      this.domNode.innerHTML = `<div class="mu-empty">&lt; ${i18n.t('Empty Mathematical Formula')} &gt;</div>`
    }
  }
}

export default MathPreview
