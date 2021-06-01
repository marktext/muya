import katex from 'katex'
import Parent from '@/block/base/parent'

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
      spellcheck: 'false'
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
    event.preventDefault()
    event.stopPropagation()

    this.parent.firstContentInDescendant().setCursor(0, 0)
  }

  update (math = this.math) {
    if (this.math !== math) {
      this.math = math
    }

    if (math) {
      try {
        const html = katex.renderToString(math, {
          displayMode: true
        })
        this.domNode.innerHTML = html
      } catch (err) {
        this.domNode.innerHTML = '<div class="mu-math-error">&lt; Invalid Mathematical Formula &gt;</div>'
      }
    } else {
      this.domNode.innerHTML = '<div class="mu-empty">&lt; Empty Mathematical Formula &gt;</div>'
    }
  }
}

export default MathPreview
