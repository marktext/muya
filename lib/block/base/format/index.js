import diff from 'fast-diff'
import json1 from 'ot-json1'
import Content from '@/block/base/content'
import { EVENT_KEYS } from '@/config'
import { diffToTextOp, mixins } from '@/utils'
import formatMethods from './format'
import clickHandler from './clickHandler'
import enterHandler from './enterHandler'
import inputHandler from './inputHandler'
import keyupHandler from './keyupHandler'

class Format extends Content {
  static blockName = 'format'

  keydownHandler = (event) => {
    switch (event.key) {
      case EVENT_KEYS.Backspace:
        this.backspaceHandler(event)
        break

      case EVENT_KEYS.Delete:
        this.deleteHandler(event)
        break

      case EVENT_KEYS.Enter:
        if (!this.isComposed) {
          this.enterHandler(event)
        }
        break

      case EVENT_KEYS.ArrowUp: // fallthrough

      case EVENT_KEYS.ArrowDown: // fallthrough

      case EVENT_KEYS.ArrowLeft: // fallthrough

      case EVENT_KEYS.ArrowRight: // fallthrough
        if (!this.isComposed) {
          this.arrowHandler(event)
        }
        break

      case EVENT_KEYS.Tab:
        this.tabHandler(event)
        break
      default:
        break
    }
  }

  backspaceHandler (event) {
    console.log('backspace')
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

mixins(Format, formatMethods, clickHandler, enterHandler, inputHandler, keyupHandler)

export default Format
