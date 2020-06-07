import Renderer from '@/inlineRenderer/renderer'
import { tokenizer } from '@/inlineRenderer/lexer'
import logger from '@/utils/logger'

const debug = logger('inlinerenderer:')

class InlineRenderer {
  constructor (muya) {
    this.muya = muya
    this.renderer = new Renderer(muya)
    this.labels = new Map()
  }

  tokenizer (text) {
    const { options } = this.muya
    const { labels } = this
    // TODO: Judge the value of `hasBeginRules` by block.static.blockName

    return tokenizer(text, { labels, options })
  }

  patch (block, cursor) {
    const { text, domNode } = block
    if (block.isContainerBlock) {
      debug.error('Patch can only handle leaf block')
    }

    const tokens = this.tokenizer(text)
    const html = this.renderer.output(tokens, block, cursor)
    domNode.innerHTML = html
  }
}

export default InlineRenderer
