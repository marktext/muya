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
      anchor: aOffset,
      focus: fOffset,
      start: Math.min(aOffset, fOffset),
      end: Math.max(aOffset, fOffset)
    }
  }

  get scrollPage () {
    return this.muya.editor.scrollPage
  }

  constructor (muya, { anchor, focus } = {}) {
    this.doc = document
    this.muya = muya
    this.anchor = anchor
    this.focus = focus
  }

  setSelection ({ anchor, focus }) {
    this.anchor = anchor
    this.focus = focus

    this.setCursor()
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
    const { anchor, focus, scrollPage } = this
    const anchorParagraph = anchor.block ? anchor.block.domNode : scrollPage.queryBlock(anchor.path)
    const focusParagraph = focus.block ? focus.block.domNode : scrollPage.queryBlock(focus.path)

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
        const textContent = getTextContent(child, [CLASS_NAMES.AG_MATH_RENDER, CLASS_NAMES.AG_RUBY_RENDER])
        const textLength = textContent.length

        // Fix #1460 - put the cursor at the next text node or element if it can be put at the last of /^\n$/ or the next text node/element.
        if (/^\n$/.test(textContent) && i !== len - 1 ? count + textLength > offset : count + textLength >= offset) {
          if (
            child.classList && child.classList.contains('mu-inline-image')
          ) {
            const imageContainer = child.querySelector('.mu-image-container')
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

    let { node: anchorNode, offset: anchorOffset } = getNodeAndOffset(anchorParagraph, anchor.offset)
    let { node: focusNode, offset: focusOffset } = getNodeAndOffset(focusParagraph, focus.offset)

    if (anchorNode.nodeType === 3 || (anchorNode.nodeType === 1 && !anchorNode.classList.contains('mu-image-container'))) {
      anchorOffset = Math.min(anchorOffset, anchorNode.textContent.length)
      focusOffset = Math.min(focusOffset, focusNode.textContent.length)
    }

    // First set the anchor node and anchor offset, make it collapsed
    this.select(anchorNode, anchorOffset)
    // Secondly, set the focus node and focus offset.
    this.setFocus(focusNode, focusOffset)
  }
}

export default Selection
