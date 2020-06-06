import LineBlock from './lineBlock'
import { h, toVNode, patch } from '../render/snabbdom'
import { tokenizer } from '../parser/parse'
import { snakeToCamel } from '../utils'
import InlineRender from '../render/formatRender'

class FormatLine extends LineBlock {
  static create (text) {
    const domNode = document.createElement('span')

    return new FormatLine(domNode, text)
  }

  constructor () {
    super()
    this.name = 'format.line'
    this.inlineRender = new InlineRender()
    this.classNames = ['mu-line', 'mu-format-line']
  }

  render (cursor, matches) {
    super.render()
    const { text } = this
    let children = ''
    const block = null
    const selector = this.getSelector()
    if (text) {
      // highlight search key in block
      const highlights = matches.filter(m => m.block === this)
      const hasBeginRules = this.parent.name !== 'table.cell'
      const tokens = tokenizer(text, highlights, hasBeginRules)
      children = tokens.reduce((acc, token) => [...acc, ...this.inlineRender[snakeToCamel(token.type)](h, cursor, block, token)], [])
    }
    const newVdom = h(selector, this.data, children)
    const oldVdom = toVNode(this.el)
    patch(oldVdom, newVdom)
  }
}

export default FormatLine
