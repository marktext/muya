import diff from 'fast-diff'
import json1 from 'ot-json1'
import Selection from '@/selection'
import { tokenizer, generator } from '@/inlineRenderer/lexer'
import { diffToTextOp } from '@/utils'

export default {
  backspaceHandler (event) {
    const { start, end } = Selection.getCursorOffsets(this.domNode)
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

      // dispatch change to modify json state
      const diffs = diff(text, this.text)
      const op = json1.editOp(this.path, 'text-unicode', diffToTextOp(diffs))

      this.jsonState.dispatch(op, 'user')
    }
  }
}
