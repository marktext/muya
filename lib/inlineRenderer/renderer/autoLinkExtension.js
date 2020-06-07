import { CLASS_NAMES } from '@/config'

// render auto_link to vdom
export default function autoLinkExtension (h, cursor, block, token, outerClass) {
  const { linkType, www, url, email } = token
  const { start, end } = token.range

  const content = this.highlight(h, block, start, end, token)

  return [
    h(`a.${CLASS_NAMES.MU_INLINE_RULE}.${CLASS_NAMES.MU_AUTO_LINK_EXTENSION}`, {
      attrs: {
        spellcheck: 'false'
      },
      props: {
        href: linkType === 'www' ? encodeURI(`http://${www}`) : (linkType === 'url' ? encodeURI(url) : `mailto:${email}`),
        target: '_blank'
      }
    }, content)
  ]
}
