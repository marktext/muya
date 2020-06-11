import diff from 'fast-diff'
import json1 from 'ot-json1'
import Format from '@/block/base/format'
import Selection from '@/selection'
import { diffToTextOp } from '@/utils'

import './index.css'

class ParagraphContent extends Format {
  static blockName = 'paragraph.content'

  static create (muya, text) {
    const content = new ParagraphContent(muya, text)

    return content
  }

  constructor (muya, text) {
    super(muya, text)
    this.classList = [...this.classList, 'mu-paragraph-content']
    this.createDomNode()
  }

  update (cursor) {
    return this.inlineRenderer.patch(this, cursor)
  }

  shiftEnterHandler = () => {
    const { text: oldText, selection, path, jsonState } = this
    const { start, end } = Selection.getCursorOffsets(this.domNode)
    this.text = oldText.substring(0, start.offset) + '\n' + oldText.substring(end.offset)
    const cursor = {
      block: this,
      path,
      start: {
        offset: start.offset + 1
      },
      end: {
        offset: start.offset + 1
      }
    }
    this.update(cursor)
    selection.setSelection(cursor)
    // dispatch operation
    const diffs = diff(oldText, this.text)
    const op = json1.editOp(path, 'text-unicode', diffToTextOp(diffs))

    jsonState.dispatch(op, 'user')
  }

  enterHandler (event) {
    if (event.shiftKey) {
      event.preventDefault()

      return this.shiftEnterHandler(event)
    }

    super.enterHandler(event)
  }
}

export default ParagraphContent
