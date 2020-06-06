import TreeNode from '@/block/base/treeNode'
// import logger from '@/utils/logger'

// const debug = logger('block.content:')

class Content extends TreeNode {
  static blockName = 'content'

  get hasFocus () {
    return document.activeElement === this.domNode
  }

  constructor (muya, parent, state) {
    super(muya, parent)
    this.tagName = 'span'
    this.classList = ['mu-content']
    this.attributes = {
      contenteditable: true
    }
    this.text = state.text
    this.isComposed = false
    this.eventIds = []
  }

  createDomNode () {
    super.createDomNode()
    this.listenDOMEvents()
    this.update()
  }

  update () {
    const { text } = this
    this.domNode.innerHTML = `<span class="mu-syntax-text">${text}</span>`
  }

  listenDOMEvents () {
    const { event } = this.muya
    const { domNode } = this

    const eventIds = [
      event.attachDOMEvent(domNode, 'input', this.inputHandler),
      event.attachDOMEvent(domNode, 'keydown', this.keydownHandler),
      event.attachDOMEvent(domNode, 'compositionend', this.composeHandler),
      event.attachDOMEvent(domNode, 'compositionstart', this.composeHandler)
    ]
    this.eventIds.push(...eventIds)
  }

  composeHandler = (event) => {
    if (event.type === 'compositionstart') {
      this.isComposed = true
    } else if (event.type === 'compositionend') {
      this.isComposed = false
      // Because the compose event will not cause `input` event, So need call `inputHandler` by ourself
      this.inputHandler(event)
    }
  }

  detachDOMEvents () {
    for (const id of this.eventIds) {
      this.muya.event.detachDOMEvent(id)
    }
  }

  inputHandler () {
    // Do nothing, because this method will implemented in sub class.
  }

  keydownHandler () {
    // Do nothing
  }

  remove () {
    super.remove()
    this.domNode.remove()
    this.domNode = null
    this.detachDOMEvents()
  }
}

export default Content
