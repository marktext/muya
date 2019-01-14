export default function multipleMath (h, cursor, block, token, outerClass) {
  const { start, end } = token.range
  const content = this.highlight(h, block, start, end, token)
  return [
    h(`span.mu-gray.mu-remove`, content)
  ]
}
