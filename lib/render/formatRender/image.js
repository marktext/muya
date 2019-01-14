import { getImageInfo } from '../../../utils'

// @todo `image-path` event
// I dont want operate dom directly, is there any better method? need help!
export default function image (h, cursor, block, token, outerClass) {
  const { start, end } = token.range

  const className = this.getClassName(outerClass, block, token, cursor)
  const imageClass = 'mu-image-marked-text'
  const titleContent = this.highlight(h, block, start, start + 2 + token.alt.length, token)
  const srcContent = this.highlight(
    h, block,
    start + 2 + token.alt.length + token.backlash.first.length + 2,
    start + 2 + token.alt.length + token.backlash.first.length + 2 + token.src.length,
    token
  )

  const secondBracketContent = this.highlight(
    h, block,
    start + 2 + token.alt.length + token.backlash.first.length,
    start + 2 + token.alt.length + token.backlash.first.length + 2,
    token
  )

  const lastBracketContent = this.highlight(h, block, end - 1, end, token)

  const firstBacklashStart = start + 2 + token.alt.length

  const secondBacklashStart = end - 1 - token.backlash.second.length

  let id
  let isSuccess
  let selector
  const imageInfo = getImageInfo(token.src + encodeURI(token.backlash.second))
  const { src } = imageInfo
  const alt = token.alt + encodeURI(token.backlash.first)

  if (src) {
    ({ id, isSuccess } = this.loadImageAsync(imageInfo, alt, className))
  }

  selector = id ? `span#${id}.${imageClass}.mu-remove` : `span.${imageClass}.mu-remove`

  if (isSuccess) {
    selector += `.${className}`
  } else {
    selector += `.mu-image-fail`
  }
  const children = [
    ...titleContent,
    ...this.backlashInToken(h, token.backlash.first, className, firstBacklashStart, token),
    ...secondBracketContent,
    h(`span.mu-image-src`, srcContent),
    ...this.backlashInToken(h, token.backlash.second, className, secondBacklashStart, token),
    ...lastBracketContent
  ]

  return isSuccess
    ? [
      h(selector, children),
      h('img', { props: { alt, src } })
    ]
    : [h(selector, children)]
}
