import { tokenizer, generator } from '@/inlineRenderer/lexer'

export default {
  backspaceHandler (event) {
    const { start, end } = this.getCursor()
    // Let input handler to handle this case.
    if (start.offset !== end.offset) {
      return
    }

    // fix: #897 in marktext repo
    const { text } = this
    const tokens = tokenizer(text, {
      options: this.muya.options
    })
    let needRender = false
    let preToken = null

    for (const token of tokens) {
      // handle delete the second $ in inline_math.
      if (
        token.range.end === start.offset &&
        token.type === 'inline_math'
      ) {
        needRender = true
        token.raw = token.raw.substr(0, token.raw.length - 1)
        break
      }

      // handle pre token is a <ruby> html tag, need preventdefault.
      if (
        token.range.start + 1 === start.offset &&
        preToken &&
        preToken.type === 'html_tag' &&
        preToken.tag === 'ruby'
      ) {
        needRender = true
        token.raw = token.raw.substr(1)
        break
      }
      preToken = token
    }

    if (needRender) {
      event.preventDefault()
      this.text = generator(tokens)

      start.offset--
      end.offset--
      this.setCursor(start.offset, end.offset, true)
    }
  }
}
