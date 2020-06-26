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

  tokenizer (text, block) {
    const { options } = this.muya
    const { labels } = this
    // TODO: different content block should have different rules.
    // eg: atxheading.content has no soft|hard line break
    // setextheading.content has no heading rules.
    const hasBeginRules = /thematicbreak\.content|paragraph\.content|atxheading\.content/.test(block.static.blockName)

    return tokenizer(text, { hasBeginRules, labels, options })
  }

  patch (block, cursor) {
    const { text, domNode } = block
    if (block.isLeafBlock) {
      debug.error('Patch can only handle content block')
    }

    const tokens = this.tokenizer(text, block)
    const html = this.renderer.output(tokens, block, cursor && cursor.block === block ? cursor : null)
    domNode.innerHTML = html
  }
}

export default InlineRenderer
