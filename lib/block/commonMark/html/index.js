import Parent from '@/block/base/parent'
import ScrollPage from '@/block/scrollPage'
import { CLASS_NAMES } from '@/config'

class HTMLBlock extends Parent {
  static blockName = 'html-block'

  static create (muya, state) {
    const htmlBlock = new HTMLBlock(muya)

    const htmlPreview = ScrollPage.loadBlock('html-preview').create(muya, state)
    const htmlContainer = ScrollPage.loadBlock('html-container').create(muya, state)

    htmlBlock.appendAttachment(htmlPreview)
    htmlBlock.append(htmlContainer)

    return htmlBlock
  }

  get path () {
    const { path: pPath } = this.parent
    const offset = this.parent.offset(this)

    return [...pPath, offset]
  }

  constructor (muya) {
    super(muya)
    this.tagName = 'figure'
    this.classList = [CLASS_NAMES.MU_HTML_BLOCK]
    const { disableHtml } = muya.options
    if (disableHtml) {
      this.classList.push(CLASS_NAMES.MU_DISABLE_HTML_RENDER)
    }
    this.createDomNode()
  }

  queryBlock (path) {
    return path.length && path[0] === 'text' ? this.firstContentInDescendant() : this
  }

  getState () {
    const state = {
      name: 'html-block',
      text: this.firstContentInDescendant().text
    }

    return state
  }
}

export default HTMLBlock
