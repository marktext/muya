import EventCenter from '@/event'
import Editor from '@/editor'
import Ui from '@/ui'
import { BLOCK_DOM_PROPERTY, MUYA_DEFAULT_OPTIONS } from '@/config'

import '@/assets/styles/index.css'
import '@/assets/styles/prismjs/light.theme.css'
import '@/assets/styles/inlineSyntax.css'
import '@/assets/styles/blockSyntax.css'

class Muya {
  static plugins = []

  static use (plugin, options = {}) {
    this.plugins.push({
      plugin,
      options
    })
  }

  constructor (element, options = {}) {
    this.version = typeof MUYA_VERSION === 'undefined' ? 'dev' : MUYA_VERSION
    this.options = Object.assign({}, MUYA_DEFAULT_OPTIONS, options)
    this.eventCenter = new EventCenter()
    this.domNode = getContainer(element, options)
    this.domNode[BLOCK_DOM_PROPERTY] = this
    this.editor = new Editor(this)
    this.ui = new Ui(this)
  }

  init () {
    this.editor.init()
    this.exportAPI()
    // UI plugins
    if (Muya.plugins.length) {
      for (const { plugin: Plugin, options: opts } of Muya.plugins) {
        this.ui[Plugin.pluginName] = new Plugin(this, opts)
      }
    }
  }

  exportAPI () {
    const apis = {
      eventCenter: ['on', 'off', 'once'],
      editor: ['getState', 'getMarkdown', 'undo', 'redo']
    }

    Object.keys(apis).forEach(key => {
      for (const api of apis[key]) {
        this[api] = this[key][api].bind(this[key])
      }
    })
  }

  descroy () {
    this.domNode[BLOCK_DOM_PROPERTY] = null
  }
}

/**
  * [ensureContainerDiv ensure container element is div]
  */
function getContainer (originContainer, options) {
  const { spellcheckEnabled } = options
  const newContainer = document.createElement('div')
  const attrs = originContainer.attributes
  // copy attrs from origin container to new container
  Array.from(attrs).forEach(attr => {
    newContainer.setAttribute(attr.name, attr.value)
  })

  // newContainer.setAttribute('contenteditable', true)
  newContainer.setAttribute('autocorrect', false)
  newContainer.setAttribute('autocomplete', 'off')
  newContainer.setAttribute('spellcheck', !!spellcheckEnabled)
  originContainer.replaceWith(newContainer)

  return newContainer
}

export default Muya
