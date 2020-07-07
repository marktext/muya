import Parent from '@/block/base/parent'
import { PREVIEW_DOMPURIFY_CONFIG } from '@/config'
import { sanitize } from '@/utils'
import { getImageSrc } from '@/utils/image'

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
    this.createDomNode()
    this.update()
  }

  update (html = this.html) {
    if (this.html !== html) {
      this.html = html
    }

    const htmlContent = sanitize(html, PREVIEW_DOMPURIFY_CONFIG)

    // handle empty html bock
    if (/^<([a-z][a-z\d]*)[^>]*?>(\s*)<\/\1>$/.test(htmlContent.trim())) {
      this.domNode.innerHTML = '<div class="ag-empty">&lt;Empty HTML Block&gt;</div>'
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
