import marked from '@/utils/marked'

export default {
  getClipboardData (event) {
    const contentBlock = this.getTargetBlock(event)

    if (!contentBlock) {
      return { html: '', text: '' }
    }

    const { start, end } = contentBlock.getCursor()
    const text = contentBlock.text.substring(start.offset, end.offset)
    const html = marked(text)

    return { html, text }
  },

  copyHandler (event) {
    const { html, text } = this.getClipboardData(event)

    event.clipboardData.setData('text/html', html)
    event.clipboardData.setData('text/plain', text)
  }
}
