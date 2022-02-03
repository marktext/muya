import marked from '@/utils/marked'

export default {
  getClipboardData (event) {
    const contentBlock = this.getTargetBlock(event)

    if (!contentBlock) {
      return { html: '', text: '' }
    }

    const { start, end } = contentBlock.getCursor()
    const text = contentBlock.text.substring(start.offset, end.offset)
    const { frontMatter = true } = this.muya.options
    const html = marked(text, { frontMatter })

    return { html, text }
  },

  copyHandler (event) {
    const { html, text } = this.getClipboardData(event)

    const { copyType } = this

    switch (copyType) {
      case 'normal': {
        event.clipboardData.setData('text/html', html)
        event.clipboardData.setData('text/plain', text)
        break
      }

      case 'copyAsHtml': {
        event.clipboardData.setData('text/html', '')
        event.clipboardData.setData('text/plain', html)
        break
      }

      case 'copyAsMarkdown': {
        event.clipboardData.setData('text/html', '')
        event.clipboardData.setData('text/plain', text)
        break
      }

      case 'copyCodeContent': {
        const codeContent = this.copyInfo
        if (typeof codeContent !== 'string') {
          return
        }
        event.clipboardData.setData('text/html', '')
        event.clipboardData.setData('text/plain', codeContent)
        break
      }
    }
  }
}
