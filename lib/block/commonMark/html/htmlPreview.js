import Parent from '@muya/block/base/parent'
import { PREVIEW_DOMPURIFY_CONFIG } from '@muya/config'
import { sanitize } from '@muya/utils'
import { getImageSrc } from '@muya/utils/image'

class HTMLPreview extends Parent {
  static blockName = 'html-preview'

  static create (muya, state) {
    const htmlBlock = new HTMLPreview(muya, state)

    return htmlBlock
  }

  constructor (muya, { text }) {
    super(muya)
    this.tagName = 'div'
    this.html = text
    this.classList = ['mu-html-preview']
    this.attributes = {
      spellcheck: 'false',
      contenteditable: 'false'
    }
    this.createDomNode()
    this.update()
  }

  update (html = this.html) {
    if (this.html !== html) {
      this.html = html
    }

    const { disableHtml } = this.muya.options
    const htmlContent = sanitize(html, PREVIEW_DOMPURIFY_CONFIG, disableHtml)

    // handle empty html bock
    if (/^<([a-z][a-z\d]*)[^>]*?>(\s*)<\/\1>$/.test(htmlContent.trim())) {
      this.domNode.innerHTML = '<div class="mu-empty">&lt;Empty HTML Block&gt;</div>'
    } else {
      const parser = new DOMParser()
      const doc = parser.parseFromString(htmlContent, 'text/html')
      const imgs = doc.documentElement.querySelectorAll('img')

      for (const img of imgs) {
        const src = img.getAttribute('src')
        const imageInfo = getImageSrc(src)
        img.setAttribute('src', imageInfo.src)
      }

      this.domNode.innerHTML = doc.documentElement.querySelector('body').innerHTML
    }
  }
}

export default HTMLPreview
