// render auto_link to vdom
export default function autoLink (h, cursor, block, token, outerClass) {
  const { start, end } = token.range
  const content = this.highlight(h, block, start, end, token)

  return [
    h(`a.mu-inline-rule`, {
      props: {
        href: token.href,
        target: '_blank'
      }
    }, content)
  ]
}
