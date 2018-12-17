// utils used in selection/index.js
import { BLOCK_DOM_PROPERTY } from '../config'

export const isMuyaLine = element => {
  return element
    && element.tagName === 'SPAN'
    && element[BLOCK_DOM_PROPERTY]
    && element[BLOCK_DOM_PROPERTY].type === 'line'
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