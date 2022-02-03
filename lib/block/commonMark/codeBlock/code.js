import Parent from '@/block/base/parent'
import ScrollPage from '@/block/scrollPage'
import { h, toHTML } from '@/utils/snabbdom'
import copyIcon from '@/assets/icons/copy/2.png'
import logger from '@/utils/logger'

const debug = logger('code:')

const renderCopyButton = () => {
  const selector = 'a.mu-code-copy'
  const iconVnode = h('i.icon', h('i.icon-inner', {
    style: {
      background: `url(${copyIcon}) no-repeat`,
      'background-size': '100%'
    }
  }, ''))

  return h(selector, {
    attrs: {
      title: 'Copy content',
      contenteditable: 'false'
    }
  }, iconVnode)
}

class Code extends Parent {
  static blockName = 'code'

  static create (muya, state) {
    const code = new Code(muya, state)

    code.append(ScrollPage.loadBlock('codeblock.content').create(muya, state))

    return code
  }

  get path () {
    const { path: pPath } = this.parent

    return [...pPath]
  }

  constructor (muya) {
    super(muya)
    this.tagName = 'code'
    this.classList = ['mu-code']
    this.createDomNode()
    this.createCopyNode()
    this.listen()
  }

  getState () {
    debug.warn('You can never call `getState` in code')
  }

  createCopyNode () {
    this.domNode.innerHTML = toHTML(renderCopyButton())
  }

  listen () {
    const { eventCenter, editor } = this.muya
    const clickHandler = event => {
      event.preventDefault()
      event.stopPropagation()
      const codeContent = this.firstContentInDescendant().text
      editor.clipboard.copy('copyCodeContent', codeContent)
    }
    eventCenter.attachDOMEvent(this.domNode.firstElementChild, 'click', clickHandler)
  }
}

export default Code
