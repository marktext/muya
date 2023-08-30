import { tokenizer, generator } from '@muya/inlineRenderer/lexer'
import { CLASS_NAMES } from '@muya/config'
import { getImageInfo } from '@muya/utils/image'

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
    let needSelectImage = false

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

      // handle pre token is a image, need preventdefault.
      if (
        token.range.start + 1 === start.offset &&
        preToken &&
        preToken.type === 'image'
      ) {
        needSelectImage = true
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

    if (needSelectImage) {
      event.stopPropagation()
      const images = this.domNode.querySelectorAll(`.${CLASS_NAMES.MU_INLINE_IMAGE}`)
      const imageWrapper = images[images.length - 1]
      const imageInfo = getImageInfo(imageWrapper)

      this.muya.editor.selection.selectedImage = Object.assign({}, imageInfo, { block: this })
      this.muya.editor.activeContentBlock = null
      this.muya.editor.selection.setSelection({
        anchor: { offset: null },
        focus: { offset: null },
        block: this,
        path: this.path
      })
    }
  }
}
