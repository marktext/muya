import diff from 'fast-diff'
import json1 from 'ot-json1'
import Content from '@/block/base/content'
import { diffToTextOp, mixins, conflict } from '@/utils'
import formatMethods from './format'
import clickHandler from './clickHandler'
import enterHandler from './enterHandler'
import inputHandler from './inputHandler'
import keyupHandler from './keyupHandler'
import backspaceHandler from './backspace'
import converter from './converter'
import { tokenizer } from '@/inlineRenderer/lexer'

class Format extends Content {
  static blockName = 'format'

  checkCursorInTokenType (text, offset, type) {
    const tokens = tokenizer(text, {
      hasBeginRules: false,
      options: this.muya.options
    })

    let result = null

    const travel = tokens => {
      for (const token of tokens) {
        if (token.range.start > offset) {
          break
        }

        if (token.type === type && offset > token.range.start && offset < token.range.end) {
          result = token
          break
        } else if (token.children) {
          travel(token.children)
        }
      }
    }

    travel(tokens)

    return result
  }

  checkNotSameToken (oldText, text) {
    const { options } = this.muya
    const oldTokens = tokenizer(oldText, {
      options
    })
    const tokens = tokenizer(text, {
      options
    })

    const oldCache = {}
    const cache = {}

    for (const { type } of oldTokens) {
      if (oldCache[type]) {
        oldCache[type]++
      } else {
        oldCache[type] = 1
      }
    }

    for (const { type } of tokens) {
      if (cache[type]) {
        cache[type]++
      } else {
        cache[type] = 1
      }
    }

    if (Object.keys(oldCache).length !== Object.keys(cache).length) {
      return true
    }

    for (const key of Object.keys(oldCache)) {
      if (!cache[key] || oldCache[key] !== cache[key]) {
        return true
      }
    }

    return false
  }

  checkNeedRender (cursor = this.selection) {
    const { labels } = this.inlineRenderer
    const { text } = this
    const { start: cStart, end: cEnd, anchor, focus } = cursor
    const startOffset = cStart ? cStart.offset : anchor.offset
    const endOffset = cEnd ? cEnd.offset : focus.offset
    const NO_NEED_TOKEN_REG = /text|hard_line_break|soft_line_break/

    for (const token of tokenizer(text, {
      labels,
      options: this.muya.options
    })) {
      if (NO_NEED_TOKEN_REG.test(token.type)) continue
      const { start, end } = token.range
      const textLen = text.length
      if (
        conflict([Math.max(0, start - 1), Math.min(textLen, end + 1)], [startOffset, startOffset]) ||
        conflict([Math.max(0, start - 1), Math.min(textLen, end + 1)], [endOffset, endOffset])
      ) {
        return true
      }
    }

    return false
  }

  deleteHandler (event) {
    console.log('delete')
  }

  blurHandler () {
    super.blurHandler()
    const needRender = this.checkNeedRender()
    if (needRender) {
      this.update()
    }
  }

  arrowHandler (event) {
    console.log('arrow')
  }

  tabHandler (event) {
    console.log('tab')
  }

  /**
   * Update emoji text if cursor is in emoji syntax.
   * @param {string} text emoji text
   */
  setEmoji (text) {
    const { anchor } = this.selection
    const editEmoji = this.checkCursorInTokenType(this.text, anchor.offset, 'emoji')
    if (editEmoji) {
      const { start, end } = editEmoji.range
      const oldText = this.text
      this.text = oldText.substring(0, start) + `:${text}:` + oldText.substring(end)
      const offset = start + text.length + 2
      const cursor = {
        start: { offset },
        end: { offset },
        block: this,
        path: this.path
      }
      this.update(cursor)
      this.selection.setSelection(cursor)
      // dispatch change to modify json state
      const diffs = diff(oldText, this.text)
      const op = json1.editOp(this.path, 'text-unicode', diffToTextOp(diffs))

      this.jsonState.dispatch(op, 'user')
    }
  }
}

mixins(
  Format,
  formatMethods,
  clickHandler,
  enterHandler,
  inputHandler,
  keyupHandler,
  backspaceHandler,
  converter
)

export default Format
