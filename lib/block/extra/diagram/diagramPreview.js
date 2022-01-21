import Parent from '@/block/base/parent'
import loadRenderer from './renderer'

const renderDiagram = async ({ type, code, target, sequenceTheme, vegaTheme, mermaidTheme }) => {
  const render = await loadRenderer(type)
  const options = {}
  if (type === 'sequence') {
    Object.assign(options, { theme: sequenceTheme })
  } else if (type === 'vega-lite') {
    Object.assign(options, {
      actions: false,
      tooltip: false,
      renderer: 'svg',
      theme: vegaTheme
    })
  }

  if (type === 'flowchart' || type === 'sequence') {
    const diagram = render.parse(code)
    target.innerHTML = ''
    diagram.drawSVG(target, options)
  } else if (type === 'plantuml') {
    const diagram = render.parse(code)
    target.innerHTML = ''
    diagram.insertImgElement(target)
  } else if (type === 'vega-lite') {
    await render(target, JSON.parse(code), options)
  } else if (type === 'mermaid') {
    render.initialize({
      theme: mermaidTheme
    })
    render.parse(code)
    target.innerHTML = code
    render.init(undefined, target)
  }
}

class DiagramPreview extends Parent {
  static blockName = 'diagram-preview'

  static create (muya, state) {
    const diagramPreview = new DiagramPreview(muya, state)

    return diagramPreview
  }

  constructor (muya, { text, meta }) {
    super(muya)
    this.tagName = 'div'
    this.code = text
    this.type = meta.type
    this.classList = ['mu-diagram-preview']
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

  async update (code = this.code) {
    if (this.code !== code) {
      this.code = code
    }

    if (code) {
      this.domNode.innerHTML = 'Loading...'
      const { mermaidTheme, sequenceTheme, vegaTheme } = this.muya.options
      const { type } = this

      try {
        await renderDiagram({
          target: this.domNode,
          code,
          type,
          mermaidTheme,
          sequenceTheme,
          vegaTheme
        })
      } catch (err) {
        this.domNode.innerHTML = '<div class="mu-diagram-error">&lt; Invalid Diagram Code &gt;</div>'
      }
    } else {
      this.domNode.innerHTML = '<div class="mu-empty">&lt; Empty Diagram &gt;</div>'
    }
  }
}

export default DiagramPreview
