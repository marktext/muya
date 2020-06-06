// utils used in selection/index.js
import { BLOCK_DOM_PROPERTY, CLASS_NAMES } from '@/config'

export const isMuyaLine = element => {
  return element &&
    element.tagName === 'SPAN' &&
    element[BLOCK_DOM_PROPERTY] &&
    element[BLOCK_DOM_PROPERTY].type === 'line'
}

export const findNearestLine = node => {
  do {
    if (isMuyaLine(node)) return node
    node = node.parentNode
  } while (node)
}

export const compareParagraphsOrder = (paragraph1, paragraph2) => {
  return paragraph1.compareDocumentPosition(paragraph2) & Node.DOCUMENT_POSITION_FOLLOWING
}

export const getTextContent = (node, blackList) => {
  if (node.nodeType === 3) {
    return node.textContent
  } else if (!blackList) {
    return node.textContent
  }

  let text = ''
  if (blackList.some(className => node.classList && node.classList.contains(className))) {
    return text
  }

  if (node.nodeType === 3) {
    text += node.textContent
  } else if (node.nodeType === 1 && node.classList.contains('ag-inline-image')) {
    // handle inline image
    const raw = node.getAttribute('data-raw')
    const imageContainer = node.querySelector('.mu-image-container')
    const hasImg = imageContainer.querySelector('img')
    const childNodes = imageContainer.childNodes
    if (childNodes.length && hasImg) {
      for (const child of childNodes) {
        if (child.nodeType === 1 && child.nodeName === 'IMG') {
          text += raw
        } else if (child.nodeType === 3) {
          text += child.textContent
        }
      }
    } else {
      text += raw
    }
  } else {
    const childNodes = node.childNodes

    for (const n of childNodes) {
      text += getTextContent(n, blackList)
    }
  }

  return text
}

export const getOffsetOfParagraph = (node, paragraph) => {
  let offset = 0
  let preSibling = node

  if (node === paragraph) return offset

  do {
    preSibling = preSibling.previousSibling
    if (preSibling) {
      offset += getTextContent(preSibling, [CLASS_NAMES.MU_MATH_RENDER, CLASS_NAMES.MU_RUBY_RENDER]).length
    }
  } while (preSibling)

  return (node === paragraph || node.parentNode === paragraph)
    ? offset
    : offset + getOffsetOfParagraph(node.parentNode, paragraph)
}
