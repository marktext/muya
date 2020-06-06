import EventCenter from '@/event'
import Editor from '@/editor'

class Muya {
  constructor (element, options = {}) {
    this.version = typeof MUYA_VERSION === 'undefined' ? 'dev' : MUYA_VERSION
    this.options = options
    this.container = getContainer(element, options)
    this.event = new EventCenter()
    this.editor = new Editor(this)
    this.exportAPI()
  }

  exportAPI () {
    const apis = {
      event: ['on', 'off', 'once']
    }

    Object.keys(apis).forEach(key => {
      for (const api of apis[key]) {
        this[api] = this[key][api].bind(this[key])
      }
    })
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

  newContainer.setAttribute('contenteditable', true)
  newContainer.setAttribute('autocorrect', false)
  newContainer.setAttribute('autocomplete', 'off')
  newContainer.setAttribute('spellcheck', !!spellcheckEnabled)
  originContainer.replaceWith(newContainer)

  return newContainer
}

export default Muya
