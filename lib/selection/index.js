import { findNearestLine, compareParagraphsOrder } from './dom'
import { BLOCK_DOM_PROPERTY } from '../config'

class Selection {
  constructor (muya) {
    this.muya = muya
    this.doc = document
    this.cursor = {
      anchor: { block: null, offset: 0 },
      focus: { block: null, offset: 0 }
    }
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

  getCursorRange () {
    let { anchorNode, anchorOffset, focusNode, focusOffset } = this.doc.getSelection()

    let anchorLine = findNearestLine(anchorNode)
    let focusLine = findNearestLine(focusNode)

    const getOffsetOfLine = (node, paragraph) => {
      let offset = 0
      let preSibling = node

      if (node === paragraph) return offset

      do {
        preSibling = preSibling.previousSibling
        if (preSibling) {
          offset += getTextContent(preSibling, [ CLASS_OR_ID['AG_MATH_RENDER'] ]).length
        }
      } while (preSibling)
      return (node === paragraph || node.parentNode === paragraph)
        ? offset
        : offset + getOffsetOfLine(node.parentNode, paragraph)
    }

    if (anchorLine === focusLine) {
      const block = anchorLine[BLOCK_DOM_PROPERTY]
      const offset1 = getOffsetOfLine(anchorNode, anchorLine) + anchorOffset
      const offset2 = getOffsetOfLine(focusNode, focusLine) + focusOffset
      return {
        start: { block, offset: Math.min(offset1, offset2) },
        end: { block, offset: Math.max(offset1, offset2) }
      }
    } else {
      const order = compareParagraphsOrder(anchorLine, focusLine)

      const rawCursor = {
        start: {
          block: anchorLine[BLOCK_DOM_PROPERTY],
          offset: getOffsetOfLine(anchorNode, anchorLine) + anchorOffset
        },
        end: {
          block: focusLine[BLOCK_DOM_PROPERTY],
          offset: getOffsetOfLine(focusNode, focusLine) + focusOffset
        }
      }
      if (order) {
        return rawCursor
      } else {
        return { start: rawCursor.end, end: rawCursor.start }
      }
    }
  }

  setCursorRange (anchor, focus = anchor) {
    this.cursor = { anchor, focus }
    const anchorLine = anchor.block.domNode
    const focusLine = focus.block.domNode
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
        if (count + getTextContent(child, [ CLASS_OR_ID['AG_MATH_RENDER'] ]).length >= offset) {
          return getNodeAndOffset(child, offset - count)
        } else {
          count += getTextContent(child, [ CLASS_OR_ID['AG_MATH_RENDER'] ]).length
        }
      }
      return { node, offset }
    }

    let { node: anchorNode, offset: anchorOffset } = getNodeAndOffset(anchorLine, anchor.offset)
    let { node: focusNode, offset: focusOffset } = getNodeAndOffset(focusLine, focus.offset)
    anchorOffset = Math.min(startOffset, anchorNode.textContent.length)
    focusOffset = Math.min(endOffset, focusNode.textContent.length)

    this.select(anchorNode, anchorOffset, focusNode, focusOffset)
  }
}

export default Selection
