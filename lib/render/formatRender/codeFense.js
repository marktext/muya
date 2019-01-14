export default function codeFense (h, cursor, block, token, outerClass) {
  const { start, end } = token.range
  const { marker } = token

  const markerContent = this.highlight(h, block, start, start + marker.length, token)
  const content = this.highlight(h, block, start + marker.length, end, token)

  return [
    h(`span.mu-gray`, markerContent),
    h(`span.mu-language`, content)
  ]
}
