import { getOffsetOfParagraph, getTextContent, findContentDOM, compareParagraphsOrder } from './dom'
import { CLASS_NAMES, BLOCK_DOM_PROPERTY } from '@/config'
class Selection {
  /**
   * topOffset is the line counts above cursor, and bottomOffset is line counts bellow cursor.
   * @param {*} paragraph
   */
  static getCursorYOffset (paragraph) {
    const { y } = this.getCursorCoords()
    const { height, top } = paragraph.getBoundingClientRect()
    const lineHeight = parseFloat(getComputedStyle(paragraph).lineHeight)
    const topOffset = Math.floor((y - top) / lineHeight)
    const bottomOffset = Math.round((top + height - lineHeight - y) / lineHeight)

    return {
      topOffset,
      bottomOffset
    }
  }

  static getCursorCoords () {
    const sel = document.getSelection()
    let range
    let rect = null

    if (sel.rangeCount) {
      range = sel.getRangeAt(0).cloneRange()
      if (range.getClientRects) {
        // range.collapse(true)
        let rects = range.getClientRects()
        if (rects.length === 0) {
          rects = range.startContainer && range.startContainer.nodeType === Node.ELEMENT_NODE
            ? range.startContainer.getClientRects()
            : []
        }

        if (rects.length) {
          rect = rects[0]
        }
      }
    }

    return rect
  }

  // https://stackoverflow.com/questions/1197401/
  // how-can-i-get-the-element-the-caret-is-in-with-javascript-when-using-contenteditable
  // by You
  static getSelectionStart () {
    const node = document.getSelection().anchorNode
    const startNode = (node && node.nodeType === 3 ? node.parentNode : node)

    return startNode
  }

  get scrollPage () {
    return this.muya.editor.scrollPage
  }

  get isCollapsed () {
    const { anchorBlock, focusBlock, anchor, focus } = this

    return anchorBlock === focusBlock && anchor.offset === focus.offset
  }

  get isSelectionInSameBlock () {
    const { anchorBlock, focusBlock } = this

    return anchorBlock === focusBlock
  }

  get direction () {
    const { anchor, focus, anchorBlock, focusBlock, isSelectionInSameBlock, isCollapsed } = this
    if (isCollapsed) {
      return 'none'
    }
    if (isSelectionInSameBlock) {
      return anchor.offset < focus.offset ? 'forward' : 'backward'
    } else {
      const aDom = anchorBlock.domNode
      const fDom = focusBlock.domNode
      const order = compareParagraphsOrder(aDom, fDom)
      
      return !!order ? 'forward' : 'backward'
    }
  }

  get type () {
    const { anchorBlock, focusBlock, isCollapsed } = this
    if (!anchorBlock && !focusBlock) {
      return 'None'
    }

    return isCollapsed ? 'Caret' : 'Range'
  }

  constructor (muya, {
    anchor, focus, anchorBlock, anchorPath, focusBlock, focusPath
  } = {}) {
    this.doc = document
    this.muya = muya
    this.anchorPath = anchorPath
    this.anchorBlock = anchorBlock
    this.focusPath = focusPath
    this.focusBlock = focusBlock
    this.anchor = anchor
    this.focus = focus
    this.listenSelectActions()
    this.selectInfo = {
      isSelect: false,
      selection: null
    }
  }

  listenSelectActions () {
    const { eventCenter, domNode } = this.muya
    const handleMousedown = () => {
      this.selectInfo = {
        isSelect: true,
        selection: null
      }
    }

    const handleMouseupOrLeave = () => {
      if (this.selectInfo.selection) {
        this.setSelection(this.selectInfo.selection)
      }
      this.selectInfo = {
        isSelect: false,
        selection: null
      }
    }

    const handleMousemoveOrClick = (event) => {
      const { type, shiftKey } = event
      if (type === 'mousemove' && !this.selectInfo.isSelect) {
        return
      }
      if (type === 'click' && !shiftKey) {
        return
      }
      const {
        anchor,
        focus,
        anchorBlock,
        focusBlock,
        isSelectionInSameBlock,
        direction
      } = this.getSelection()

      if (!anchorBlock || !focusBlock) {
        // The cursor is not in editor
        return
      }

      if (isSelectionInSameBlock) {
        // No need to handle this case
        return
      }

      const newSelection = {
        anchor,
        focus,
        anchorBlock,
        focusBlock,
        anchorPath: anchorBlock.path,
        focusPath: focusBlock.path
      }

      const anchorOutMostBlock = anchorBlock.outMostBlock
      const focusOutMostBlock = focusBlock.outMostBlock
      if (/block-quote|code-block|html-block|table|math-block|frontmatter|diagram/.test(anchorOutMostBlock.blockName)) {
        const firstContent = anchorOutMostBlock.firstContentInDescendant()
        const lastContent = anchorOutMostBlock.lastContentInDescendant()
        if (direction === 'forward') {
          newSelection.anchorBlock = firstContent
          newSelection.anchorPath = firstContent.path
          newSelection.anchor.offset = 0
        } else {
          newSelection.anchorBlock = lastContent
          newSelection.anchorPath = lastContent.path
          newSelection.anchor.offset = lastContent.text.length
        }
      }

      if (/block-quote|code-block|html-block|table|math-block|frontmatter|diagram/.test(focusOutMostBlock.blockName)) {
        const firstContent = focusOutMostBlock.firstContentInDescendant()
        const lastContent = focusOutMostBlock.lastContentInDescendant()
        if (direction === 'forward') {
          newSelection.focusBlock = lastContent
          newSelection.focusPath = lastContent.path
          newSelection.focus.offset = lastContent.text.length
        } else {
          newSelection.focusBlock = firstContent
          newSelection.focusPath = firstContent.path
          newSelection.focus.offset = 0
        }
      }

      if (/bullet-list|order-list|task-list/.test(anchorOutMostBlock.blockName)) {
        const listItemBlockName = anchorOutMostBlock.blockName === 'task-list' ? 'task-list-item' : 'list-item'
        const listItem = anchorBlock.farthestBlock(listItemBlockName)
        const firstContent = listItem.firstContentInDescendant()
        const lastContent = listItem.lastContentInDescendant()
        if (direction === 'forward') {
          newSelection.anchorBlock = firstContent
          newSelection.anchorPath = firstContent.path
          newSelection.anchor.offset = 0
        } else {
          newSelection.anchorBlock = lastContent
          newSelection.anchorPath = lastContent.path
          newSelection.anchor.offset = lastContent.text.length
        }
      }

      if (/bullet-list|order-list|task-list/.test(focusOutMostBlock.blockName)) {
        const listItemBlockName = focusOutMostBlock.blockName === 'task-list' ? 'task-list-item' : 'list-item'
        const listItem = focusBlock.farthestBlock(listItemBlockName)
        const firstContent = listItem.firstContentInDescendant()
        const lastContent = listItem.lastContentInDescendant()
        if (direction === 'forward') {
          newSelection.focusBlock = lastContent
          newSelection.focusPath = lastContent.path
          newSelection.focus.offset = lastContent.text.length
        } else {
          newSelection.focusBlock = firstContent
          newSelection.focusPath = firstContent.path
          newSelection.focus.offset = 0
        }
      }


      if (type === 'mousemove') {
        this.selectInfo.selection = newSelection
      } else {
        this.setSelection(newSelection)
      }
    }

    eventCenter.attachDOMEvent(domNode, 'mousedown', handleMousedown)
    eventCenter.attachDOMEvent(domNode, 'mousemove', handleMousemoveOrClick)
    eventCenter.attachDOMEvent(domNode, 'mouseup', handleMouseupOrLeave)
    eventCenter.attachDOMEvent(domNode, 'mouseleave', handleMouseupOrLeave)
    eventCenter.attachDOMEvent(domNode, 'click', handleMousemoveOrClick)
  }

  selectAll () {
    const { anchor, focus, isSelectionInSameBlock, anchorBlock, anchorPath, scrollPage } = this
    // Select all in one content block.
    if (isSelectionInSameBlock && Math.abs(focus.offset - anchor.offset) < anchorBlock.text.length) {
      const cursor = {
        anchor: { offset: 0 },
        focus: { offset: anchorBlock.text.length },
        block: anchorBlock,
        path: anchorPath
      }

      this.setSelection(cursor)
      return
    }
    // Select all content in all blocks.
    const aBlock = scrollPage.firstContentInDescendant()
    const fBlock = scrollPage.lastContentInDescendant()

    const cursor = {
      anchor: { offset: 0 },
      focus: { offset: fBlock.text.length },
      anchorBlock: aBlock,
      anchorPath: aBlock.path,
      focusBlock: fBlock,
      focusPath: fBlock.path
    }

    this.setSelection(cursor)
    const activeEle = document.activeElement
    if (activeEle && activeEle.classList.contains('mu-content')) {
      activeEle.blur()
    }
  }

  /**
   * Return the current selection of doc.
   * @returns 
   */
  getSelection () {
    const { anchorNode, anchorOffset, focusNode, focusOffset } = document.getSelection()
    const anchorDomNode = findContentDOM(anchorNode)
    const focusDomNode = findContentDOM(focusNode)

    if (!anchorDomNode || !focusDomNode) {
      return {}
    }

    const anchorBlock = anchorDomNode[BLOCK_DOM_PROPERTY]
    const focusBlock = focusDomNode[BLOCK_DOM_PROPERTY]
    const anchorPath = anchorBlock.path
    const focusPath = focusBlock.path

    const aOffset = getOffsetOfParagraph(anchorNode, anchorDomNode) + anchorOffset
    const fOffset = getOffsetOfParagraph(focusNode, focusDomNode) + focusOffset
    const anchor = { offset: aOffset }
    const focus = { offset: fOffset }
    const isCollapsed = anchorBlock === focusBlock && anchor.offset === focus.offset
    const isSelectionInSameBlock = anchorBlock === focusBlock
    let direction = 'none'
    if (isCollapsed) {
      direction = 'none'
    }
    if (isSelectionInSameBlock) {
      direction = anchor.offset < focus.offset ? 'forward' : 'backward'
    } else {
      const aDom = anchorBlock.domNode
      const fDom = focusBlock.domNode
      const order = compareParagraphsOrder(aDom, fDom)
      direction = !!order ? 'forward' : 'backward'
    }

    return {
      anchor,
      focus,
      anchorBlock,
      anchorPath,
      focusBlock,
      focusPath,
      isCollapsed,
      isSelectionInSameBlock,
      direction
    }
  }

  setSelection ({
    anchor,
    focus,
    start,
    end,
    block,
    path,
    anchorBlock,
    anchorPath,
    focusBlock,
    focusPath
  }) {
    this.anchor = anchor ?? start
    this.focus = focus ?? end
    this.anchorBlock = anchorBlock ?? block
    this.anchorPath = anchorPath ?? path
    this.focusBlock = focusBlock ?? block
    this.focusPath = focusPath ?? path
    this.setCursor()

    const { isCollapsed, isSelectionInSameBlock } = this

    this.muya.eventCenter.emit('selection-change', {
      anchor,
      focus,
      anchorBlock,
      anchorPath,
      focusBlock,
      focusPath,
      isCollapsed,
      isSelectionInSameBlock
    })
  }

  selectRange (range) {
    const selection = this.doc.getSelection()

    selection.removeAllRanges()
    selection.addRange(range)
  }

  select (startNode, startOffset, endNode, endOffset) {
    const range = this.doc.createRange()
    range.setStart(startNode, startOffset)
    if (endNode) {
      range.setEnd(endNode, endOffset)
    } else {
      range.collapse(true)
    }
    this.selectRange(range)

    return range
  }

  setFocus (focusNode, focusOffset) {
    const selection = this.doc.getSelection()
    selection.extend(focusNode, focusOffset)
  }

  setCursor () {
    const { anchor, focus, anchorBlock, anchorPath, focusBlock, focusPath, scrollPage } = this
    const anchorPargraph = anchorBlock ? anchorBlock.domNode : scrollPage.queryBlock(anchorPath)
    const focusParagraph = focusBlock ? focusBlock.domNode : scrollPage.queryBlock(focusPath)

    const getNodeAndOffset = (node, offset) => {
      if (node.nodeType === 3) {
        return {
          node,
          offset
        }
      }

      const childNodes = node.childNodes
      const len = childNodes.length
      let i
      let count = 0

      for (i = 0; i < len; i++) {
        const child = childNodes[i]
        const textContent = getTextContent(child, [CLASS_NAMES.MU_MATH_RENDER, CLASS_NAMES.MU_RUBY_RENDER])
        const textLength = textContent.length

        // Fix #1460 - put the cursor at the next text node or element if it can be put at the last of /^\n$/ or the next text node/element.
        if (/^\n$/.test(textContent) && i !== len - 1 ? count + textLength > offset : count + textLength >= offset) {
          if (
            child.classList && child.classList.contains(`${CLASS_NAMES.MU_INLINE_IMAGE}`)
          ) {
            const imageContainer = child.querySelector(`.${CLASS_NAMES.MU_IMAGE_CONTAINER}`)
            const hasImg = imageContainer.querySelector('img')

            if (!hasImg) {
              return {
                node: child,
                offset: 0
              }
            }

            if (count + textLength === offset) {
              if (child.nextElementSibling) {
                return {
                  node: child.nextElementSibling,
                  offset: 0
                }
              } else {
                return {
                  node: imageContainer,
                  offset: 1
                }
              }
            } else if (count === offset && count === 0) {
              return {
                node: imageContainer,
                offset: 0
              }
            } else {
              return {
                node: child,
                offset: 0
              }
            }
          } else {
            return getNodeAndOffset(child, offset - count)
          }
        } else {
          count += textLength
        }
      }

      return { node, offset }
    }

    const { node: anchorNode, offset: anchorOffset } = getNodeAndOffset(anchorPargraph, anchor.offset)
    const { node: focusNode, offset: focusOffset } = getNodeAndOffset(focusParagraph, focus.offset)

    // First set the anchor node and anchor offset, make it collapsed
    this.select(anchorNode, anchorOffset)
    // Secondly, set the focus node and focus offset.
    this.setFocus(focusNode, focusOffset)
  }
}

export default Selection
