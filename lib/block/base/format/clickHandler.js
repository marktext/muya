import Selection from '@/selection'
import { CLASS_NAMES } from '@/config'
import { getCursorReference } from '@/utils'

export default {
  clickHandler (event) {
    // Handler click inline math and inline ruby html.
    const { target } = event
    const inlineRuleRenderEle = target.closest(`.${CLASS_NAMES.MU_MATH_RENDER}`) || target.closest(`.${CLASS_NAMES.MU_RUBY_RENDER}`)
    if (inlineRuleRenderEle) {
      const startOffset = +inlineRuleRenderEle.getAttribute('data-start')
      const endOffset = +inlineRuleRenderEle.getAttribute('data-end')
      const cursor = {
        path: this.path,
        block: this,
        start: {
          offset: startOffset
        },
        end: {
          offset: endOffset
        }
      }
      this.update(cursor)

      return this.selection.setSelection(cursor)
    }

    requestAnimationFrame(() => {
      const cursor = Selection.getCursorOffsets(this.domNode)
      const needRender = this.selection.block === this
        ? this.checkNeedRender(cursor) || this.checkNeedRender()
        : this.checkNeedRender(cursor)

      if (needRender) {
        this.update(cursor)
      }

      this.selection.setSelection({
        ...cursor,
        block: this,
        path: this.path
      })

      // Check and show format picker
      if (cursor.start.offset !== cursor.end.offset) {
        const reference = getCursorReference()

        this.muya.eventCenter.emit('muya-format-picker', {
          reference,
          block: this
        })
      }
    })
  }
}
