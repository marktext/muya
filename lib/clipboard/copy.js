import marked from '@/utils/marked'

export default {
  getClipboardData (event) {
    const { copyType, copyInfo } = this
    if (copyType === 'copyCodeContent') {
      return {
        html: '',
        text: copyInfo
      }
    }

    let text = ''
    let html = ''

    const { isSelectionInSameBlock } = this.selection

    // Handler copy/cut in one block.
    if (isSelectionInSameBlock) {
      const contentBlock = this.getTargetBlock(event)

      if (!contentBlock) {
        return { html, text }
      }
  
      const { start, end } = contentBlock.getCursor()
      const { frontMatter = true } = this.muya.options
      text = contentBlock.text.substring(start.offset, end.offset)
      html = marked(text, { frontMatter })

      return { html, text }
    }
    // Handle select multiple blocks.

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
        event.clipboardData.setData('text/html', '')
        event.clipboardData.setData('text/plain', text)
        break
      }
    }
  }
}
