
import Selection from '@/selection'
import { getCursorReference } from '@/utils'

export default {
  keyupHandler (event) {
    if (this.isComposed) {
      return
    }

    const { anchor, focus } = Selection.getCursorOffsets(this.domNode)
    const { anchor: oldAnchor, focus: oldFocus } = this.selection

    if (anchor.offset !== oldAnchor.offset || focus.offset !== oldFocus.offset) {
      const needUpdate = this.checkNeedRender({ anchor, focus }) || this.checkNeedRender()
      const cursor = { anchor, focus, block: this, path: this.path }

      if (needUpdate) {
        this.update(cursor)
      }

      this.selection.setSelection(cursor)
    }

    // Check not edit emiji
    const editEmoji = this.checkCursorInTokenType(this.text, anchor.offset, 'emoji')
    if (!editEmoji) {
      this.muya.eventCenter.emit('muya-emoji-picker', {
        emojiText: ''
      })
    }

    // Check and show format picker
    if (anchor.offset !== focus.offset) {
      const reference = getCursorReference()

      this.muya.eventCenter.emit('muya-format-picker', {
        reference,
        block: this
      })
    }
  }
}
