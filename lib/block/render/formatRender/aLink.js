import { snakeToCamel } from '../../../utils'

// `a_link`: `<a href="url">anchor</a>`
export default function aLink (h, cursor, block, token, outerClass) {
  const className = this.getClassName(outerClass, block, token, cursor)
  const tagClassName = className === 'mu-hide' ? className : 'mu-html-tag'
  const { start, end } = token.range
  const openTag = this.highlight(h, block, start, start + token.openTag.length, token)
  const anchor = token.children.reduce((acc, to) => {
    const chunk = this[snakeToCamel(to.type)](h, cursor, block, to, className)
    return Array.isArray(chunk) ? [...acc, ...chunk] : [...acc, chunk]
  }, [])
  const closeTag = this.highlight(h, block, end - token.closeTag.length, end, token)

  return [
    h(`span.${tagClassName}.mu-output-remove`, openTag),
    h(`a.mu-a-link`, {
      dataset: {
        href: token.href
      }
    }, anchor),
    h(`span.${tagClassName}.mu-output-remove`, closeTag)
  ]
}
