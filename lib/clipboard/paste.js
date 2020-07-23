import { normalizePastedHTML } from '@/utils/paste'
import { URL_REG } from '@/config'

export default {
  async pasteHandler (event) {
    event.preventDefault()
    event.stopPropagation()

    const contentBlock = this.getTargetBlock(event)
    if (!contentBlock) {
      return
    }

    const text = event.clipboardData.getData('text/plain')
    let html = event.clipboardData.getData('text/html')

    // Support pasted URLs from Firefox.
    if (URL_REG.test(text) && !/\s/.test(text) && !html) {
      html = `<a href="${text}">${text}</a>`
    }

    // Remove crap from HTML such as meta data and styles.
    html = await normalizePastedHTML(html)

    const { start, end } = contentBlock.getCursor()
    console.log(start, end)
    console.log(html, text)
  }
}
