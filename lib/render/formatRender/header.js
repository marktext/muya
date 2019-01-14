export default function header (h, cursor, block, token, outerClass) {
  const { start, end } = token.range
  const className = this.getClassName(outerClass, block, token, cursor)
  const content = this.highlight(h, block, start, end, token)

  return [
    h(`span.${className}.mu-remove`, content)
  ]
}
