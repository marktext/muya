export default function inlineCode (h, cursor, block, token, outerClass) {
  const className = this.getClassName(outerClass, block, token, cursor)
  const { marker } = token
  const { start, end } = token.range

  const startMarker = this.highlight(h, block, start, start + marker.length, token)
  const endMarker = this.highlight(h, block, end - marker.length, end, token)
  const content = this.highlight(h, block, start + marker.length, end - marker.length, token)

  return [
    h(`span.${className}.mu-remove`, startMarker),
    h(`code.mu-inline-rule`, content),
    h(`span.${className}.mu-remove`, endMarker)
  ]
}
