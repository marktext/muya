import { getOffsetOfParagraph, getTextContent } from './dom'
import { CLASS_NAMES } from '@/config'
class Selection {
  /**
   * get the anchor and focus offset in paragraph
   */
  static getCursorOffsets (paragraph) {
    const { anchorNode, anchorOffset, focusNode, focusOffset } = document.getSelection()
    const aOffset = getOffsetOfParagraph(anchorNode, paragraph) + anchorOffset
    const fOffset = getOffsetOfParagraph(focusNode, paragraph) + focusOffset

    return {
      anchor: { offset: aOffset },
      focus: { offset: fOffset },
      start: { offset: Math.min(aOffset, fOffset) },
      end: { offset: Math.max(aOffset, fOffset) }
    }
  }

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

  get start () {
    const { anchor, focus } = this

    return anchor.offset <= focus.offset ? anchor : focus
  }

  get end () {
    const { anchor, focus } = this

    return anchor.offset <= focus.offset ? focus : anchor
  }

  get isCollapsed () {
    const { anchorBlock, focusBlock, anchor, focus } = this

    return anchorBlock === focusBlock && anchor.offset === focus.offset
  }

  get isSelectionInSameBlock () {
    const { anchorBlock, focusBlock } = this

    return anchorBlock === focusBlock
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
  }

  selectAll () {
    const { start, end, isSelectionInSameBlock, anchorBlock, anchorPath, scrollPage } = this
    // Select all in one content block.
    if (isSelectionInSameBlock && end.offset - start.offset < anchorBlock.text.length) {
      const cursor = {
        start: { offset: 0 },
        end: { offset: anchorBlock.text.length },
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
      start: { offset: 0 },
      end: { offset: fBlock.text.length },
      anchorBlock: aBlock,
      anchorPath: aBlock.path,
      focusBlock: fBlock,
      focusPath: fBlock.path
    }

    this.setSelection(cursor)
    document.activeElement.blur()
  }

  getSelection () {
    const {
      anchor,
      focus,
      anchorBlock,
      anchorPath,
      focusBlock,
      focusPath,
      start,
      end,
      isCollapsed,
      isSelectionInSameBlock
    } = this

    return {
      anchor,
      focus,
      anchorBlock,
      anchorPath,
      focusBlock,
      focusPath,
      start,
      end,
      isCollapsed,
      isSelectionInSameBlock
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
      start,
      end,
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
