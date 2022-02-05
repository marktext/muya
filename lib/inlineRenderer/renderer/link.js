import { CLASS_NAMES } from '@/config'
import { isLengthEven, snakeToCamel } from '@/utils'
import { sanitizeHyperlink } from '@/utils/url'

// 'link': /^(\[)((?:\[[^\]]*\]|[^\[\]]|\](?=[^\[]*\]))*?)(\\*)\]\((.*?)(\\*)\)/, // can nest
export default function link (h, cursor, block, token, outerClass) {
  const className = this.getClassName(outerClass, block, token, cursor)
  const linkClassName = className === CLASS_NAMES.MU_HIDE ? className : CLASS_NAMES.MU_LINK_IN_BRACKET
  const { start, end } = token.range
  const firstMiddleBracket = this.highlight(h, block, start, start + 3, token)

  const firstBracket = this.highlight(h, block, start, start + 1, token)
  const middleBracket = this.highlight(
    h, block,
    start + 1 + token.anchor.length + token.backlash.first.length,
    start + 1 + token.anchor.length + token.backlash.first.length + 2,
    token
  )
  const hrefContent = this.highlight(
    h, block,
    start + 1 + token.anchor.length + token.backlash.first.length + 2,
    start + 1 + token.anchor.length + token.backlash.first.length + 2 + token.hrefAndTitle.length,
    token
  )
  const middleHref = this.highlight(
    h, block, start + 1 + token.anchor.length + token.backlash.first.length,
    block, start + 1 + token.anchor.length + token.backlash.first.length + 2 + token.hrefAndTitle.length,
    token
  )

  const lastBracket = this.highlight(h, block, end - 1, end, token)

  const firstBacklashStart = start + 1 + token.anchor.length
  const secondBacklashStart = end - 1 - token.backlash.second.length

  if (isLengthEven(token.backlash.first) && isLengthEven(token.backlash.second)) {
    if (!token.children.length && !token.backlash.first) { // no-text-link
      return [
        h(`span.${CLASS_NAMES.MU_GRAY}.${CLASS_NAMES.MU_REMOVE}`, firstMiddleBracket),
        h(`a.${CLASS_NAMES.MU_NOTEXT_LINK}.${CLASS_NAMES.MU_INLINE_RULE}`, {
          props: {
            href: sanitizeHyperlink(token.href + encodeURI(token.backlash.second)),
            target: '_blank',
            title: token.title
          }
        }, [
          ...hrefContent,
          ...this.backlashInToken(h, token.backlash.second, className, secondBacklashStart, token)
        ]),
        h(`span.${CLASS_NAMES.MU_GRAY}.${CLASS_NAMES.MU_REMOVE}`, lastBracket)
      ]
    } else { // has children
      return [
        h(`span.${className}.${CLASS_NAMES.MU_REMOVE}`, firstBracket),
        h(`a.${CLASS_NAMES.MU_INLINE_RULE}`, {
          props: {
            href: sanitizeHyperlink(token.href + encodeURI(token.backlash.second)),
            target: '_blank',
            title: token.title
          },
          dataset: {
            start,
            end,
            raw: token.raw
          }
        }, [
          ...token.children.reduce((acc, to) => {
            const chunk = this[snakeToCamel(to.type)](h, cursor, block, to, className)

            return Array.isArray(chunk) ? [...acc, ...chunk] : [...acc, chunk]
          }, []),
          ...this.backlashInToken(h, token.backlash.first, className, firstBacklashStart, token)
        ]),
        h(`span.${className}.${CLASS_NAMES.MU_REMOVE}`, middleBracket),
        h(`span.${linkClassName}.${CLASS_NAMES.MU_REMOVE}`, {
          attrs: { spellcheck: 'false' }
        }, [
          ...hrefContent,
          ...this.backlashInToken(h, token.backlash.second, className, secondBacklashStart, token)
        ]),
        h(`span.${className}.${CLASS_NAMES.MU_REMOVE}`, lastBracket)
      ]
    }
  } else {
    return [
      ...firstBracket,
      ...token.children.reduce((acc, to) => {
        const chunk = this[snakeToCamel(to.type)](h, cursor, block, to, className)

        return Array.isArray(chunk) ? [...acc, ...chunk] : [...acc, chunk]
      }, []),
      ...this.backlashInToken(h, token.backlash.first, className, firstBacklashStart, token),
      ...middleHref,
      ...this.backlashInToken(h, token.backlash.second, className, secondBacklashStart, token),
      ...lastBracket
    ]
  }
}
