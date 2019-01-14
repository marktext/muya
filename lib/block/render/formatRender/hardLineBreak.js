export default function hardLineBreak (h, cursor, block, token, outerClass) {
  const className = 'mu-hard-line-break'
  const content = [token.spaces]
  if (block.type === 'span' && block.nextSibling) {
    return [
      h(`span.${className}`, content)
    ]
  } else {
    return content
  }
}
