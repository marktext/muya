import katex from 'katex'
import { htmlToVNode } from '../snabbdom'

import 'katex/dist/katex.min.css'

export default function displayMath (h, cursor, block, token, outerClass) {
  const className = this.getClassName(outerClass, block, token, cursor)
  const { start, end } = token.range
  const { marker } = token

  const startMarker = this.highlight(h, block, start, start + marker.length, token)
  const endMarker = this.highlight(h, block, end - marker.length, end, token)
  const content = this.highlight(h, block, start + marker.length, end - marker.length, token)

  const { content: math, type } = token

  const { loadMathMap } = this

  const displayMode = false
  const key = `${math}_${type}`
  let mathVnode = null
  let previewSelector = `span.mu-math-render`
  if (loadMathMap.has(key)) {
    mathVnode = loadMathMap.get(key)
  } else {
    try {
      const html = katex.renderToString(math, {
        displayMode
      })
      mathVnode = htmlToVNode(html)
      loadMathMap.set(key, mathVnode)
    } catch (err) {
      mathVnode = '< Invalid Mathematical Formula >'
      previewSelector += `.mu-math-error`
    }
  }

  return [
    h(`span.${className}.mu-math-marker`, startMarker),
    h(`span.${className}.mu-math`, [
      h(`span.mu-math-text`, content),
      h(previewSelector, {
        attrs: { contenteditable: 'false' }
      }, mathVnode)
    ]),
    h(`span.${className}.mu-math-marker`, endMarker)
  ]
}
