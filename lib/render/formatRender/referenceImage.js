import { getImageInfo } from '../../../utils'

// reference_image
export default function htmlImage (h, cursor, block, token, outerClass) {
  const className = this.getClassName(outerClass, block, token, cursor)
  const imageClass = 'mu-image-marked-text'
  const { start, end } = token.range
  const tag = this.highlight(h, block, start, end, token)
  const { label, backlash, alt } = token
  const rawSrc = label + backlash.second
  let href = ''
  let title = ''
  if (this.labels.has((rawSrc).toLowerCase())) {
    ({ href, title } = this.labels.get(rawSrc.toLowerCase()))
  }
  const imageInfo = getImageInfo(href)
  const { src } = imageInfo
  let id
  let isSuccess
  let selector
  if (src) {
    ({ id, isSuccess } = this.loadImageAsync(imageInfo, alt, className, 'mu-copy-remove'))
  }
  selector = id ? `span#${id}.${imageClass}` : `span.${imageClass}`
  selector += `.mu-output-remove`
  if (isSuccess) {
    selector += `.${className}`
  } else {
    selector += `.mu-image-fail`
  }

  return isSuccess
    ? [
      h(selector, tag),
      h(`img.mu-copy-remove`, { props: { alt, src, title } })
    ]
    : [h(selector, tag)]
}
