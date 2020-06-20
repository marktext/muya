import TreeNode from '@/block/base/treeNode'
import { tokenizer } from '@/inlineRenderer/lexer'
import { conflict } from '@/utils'
// import logger from '@/utils/logger'

// const debug = logger('block.content:')

class Content extends TreeNode {
  static blockName = 'content'

  get hasFocus () {
    return document.activeElement === this.domNode
  }

  get jsonState () {
    return this.muya.editor.jsonState
  }

  get selection () {
    return this.muya.editor.selection
  }

  get inlineRenderer () {
    return this.muya.editor.inlineRenderer
  }

  get path () {
    const { path: pPath } = this.parent

    return [...pPath, 'text']
  }

  constructor (muya, text) {
    super(muya)
    this.tagName = 'span'
    this.classList = ['mu-content']
    this.attributes = {
      contenteditable: true
    }
    this.text = text
    this.isComposed = false
    this.eventIds = []
  }

  checkCursorInTokenType (text, offset, type) {
    const tokens = tokenizer(text, {
      hasBeginRules: false,
      options: this.muya.options
    })

    let result = null

    const travel = tokens => {
      for (const token of tokens) {
        if (token.range.start > offset) {
          break
        }

        if (token.type === type && offset > token.range.start && offset < token.range.end) {
          result = token
          break
        } else if (token.children) {
          travel(token.children)
        }
      }
    }

    travel(tokens)

    return result
  }

  checkNotSameToken (oldText, text) {
    const { options } = this.muya
    const oldTokens = tokenizer(oldText, {
      options
    })
    const tokens = tokenizer(text, {
      options
    })

    const oldCache = {}
    const cache = {}

    for (const { type } of oldTokens) {
      if (oldCache[type]) {
        oldCache[type]++
      } else {
        oldCache[type] = 1
      }
    }

    for (const { type } of tokens) {
      if (cache[type]) {
        cache[type]++
      } else {
        cache[type] = 1
      }
    }

    if (Object.keys(oldCache).length !== Object.keys(cache).length) {
      return true
    }

    for (const key of Object.keys(oldCache)) {
      if (!cache[key] || oldCache[key] !== cache[key]) {
        return true
      }
    }

    return false
  }

  checkNeedRender (cursor = this.selection) {
    const { labels } = this.inlineRenderer
    const { text } = this
    const { start: cStart, end: cEnd, anchor, focus } = cursor
    const startOffset = cStart ? cStart.offset : anchor.offset
    const endOffset = cEnd ? cEnd.offset : focus.offset
    const NO_NEED_TOKEN_REG = /text|hard_line_break|soft_line_break/

    for (const token of tokenizer(text, {
      labels,
      options: this.muya.options
    })) {
      if (NO_NEED_TOKEN_REG.test(token.type)) continue
      const { start, end } = token.range
      const textLen = text.length
      if (
        conflict([Math.max(0, start - 1), Math.min(textLen, end + 1)], [startOffset, startOffset]) ||
        conflict([Math.max(0, start - 1), Math.min(textLen, end + 1)], [endOffset, endOffset])
      ) {
        return true
      }
    }

    return false
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
    const { eventCenter } = this.muya
    const { domNode } = this

    const eventIds = [
      eventCenter.attachDOMEvent(domNode, 'input', this.inputHandler.bind(this)),
      eventCenter.attachDOMEvent(domNode, 'keydown', this.keydownHandler.bind(this)),
      eventCenter.attachDOMEvent(domNode, 'keyup', this.keyupHandler.bind(this)),
      eventCenter.attachDOMEvent(domNode, 'click', this.clickHandler.bind(this)),
      eventCenter.attachDOMEvent(domNode, 'blur', this.blurHandler.bind(this)),
      eventCenter.attachDOMEvent(domNode, 'focus', this.focusHandler.bind(this)),
      eventCenter.attachDOMEvent(domNode, 'compositionend', this.composeHandler.bind(this)),
      eventCenter.attachDOMEvent(domNode, 'compositionstart', this.composeHandler.bind(this))
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

  // Do nothing, because this method will implemented in sub class.
  inputHandler () {}
  keydownHandler () {}
  keyupHandler () {}
  clickHandler () {}

  blurHandler () {
    console.log(this.parent)
    let block = this.parent
    while (block && block.isContainerBlock) {
      block.active = false
      block = block.parent
    }
  }

  focusHandler () {
    let block = this.parent
    while (block && block.isContainerBlock) {
      block.active = true
      block = block.parent
    }
  }

  remove () {
    super.remove()
    this.domNode.remove()
    this.domNode = null
    this.detachDOMEvents()
  }
}

export default Content
