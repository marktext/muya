import Selection from '@/selection'
import { CLASS_NAMES } from '@/config'
import { getCursorReference } from '@/utils'
import { getImageInfo } from '@/utils/image'

export default {
  handleClickInlineRuleRender (event, inlineRuleRenderEle) {
    event.preventDefault()
    event.stopPropagation()
    const startOffset = +inlineRuleRenderEle.getAttribute('data-start')
    const endOffset = +inlineRuleRenderEle.getAttribute('data-end')

    return this.setCursor(startOffset, endOffset, true)
  },

  // Handle click inline image.
  handleClickInlineImage (event, imageWrapper) {
    event.preventDefault()
    event.stopPropagation()
    const { eventCenter } = this.muya
    const { target } = event
    // Handle image click, to select the current image
    if (target.tagName === 'IMG') {
      // Handle show image toolbar
      const imageInfo = getImageInfo(imageWrapper)
      const rect = imageWrapper.querySelector(`.${CLASS_NAMES.MU_IMAGE_CONTAINER}`).getBoundingClientRect()
      const reference = {
        getBoundingClientRect: () => rect,
        width: imageWrapper.offsetWidth,
        height: imageWrapper.offsetHeight
      }

      eventCenter.emit('muya-image-toolbar', {
        block: this,
        reference,
        imageInfo
      })

      // Handle show image transformer
      const imageSelector = `#${imageInfo.imageId}`

      const imageContainer = document.querySelector(`${imageSelector} .${CLASS_NAMES.MU_IMAGE_CONTAINER}`)

      eventCenter.emit('muya-transformer', {
        block: this,
        reference: imageContainer,
        imageInfo
      })

      return
    }

    // Handle click imagewrapper when it's empty or image load failed.
    if (
      imageWrapper.classList.contains(CLASS_NAMES.MU_EMPTY_IMAGE) ||
        imageWrapper.classList.contains(CLASS_NAMES.MU_IMAGE_FAIL)
    ) {
      const rect = imageWrapper.getBoundingClientRect()
      const reference = {
        getBoundingClientRect: () => rect
      }
      const imageInfo = getImageInfo(imageWrapper)
      console.log(imageInfo)
      eventCenter.emit('muya-image-selector', {
        block: this,
        reference,
        imageInfo,
        cb: () => {}
      })
    }
  },

  clickHandler (event) {
    // Handler click inline math and inline ruby html.
    const { target } = event
    const inlineRuleRenderEle = target.closest(`.${CLASS_NAMES.MU_MATH_RENDER}`) || target.closest(`.${CLASS_NAMES.MU_RUBY_RENDER}`)
    const imageWrapper = target.closest(`.${CLASS_NAMES.MU_INLINE_IMAGE}`)

    if (inlineRuleRenderEle) {
      return this.handleClickInlineRuleRender(event, inlineRuleRenderEle)
    } else if (imageWrapper) {
      return this.handleClickInlineImage(event, imageWrapper)
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
