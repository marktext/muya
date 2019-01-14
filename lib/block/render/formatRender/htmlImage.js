import { getImageInfo } from '../../../utils'

// html_image
export default function htmlImage (h, cursor, block, token, outerClass) {
  const className = this.getClassName(outerClass, block, token, cursor)
  const imageClass = 'mu-image-marked-text'
  const { start, end } = token.range
  const tag = this.highlight(h, block, start, end, token)
  const { src: rawSrc, alt } = token
  const imageInfo = getImageInfo(rawSrc)
  const { src } = imageInfo
  let id
  let isSuccess
  let selector
  if (src) {
    ({ id, isSuccess } = this.loadImageAsync(imageInfo, alt, className, 'mu-copy-remove'))
  }
  selector = id ? `span#${id}.${imageClass}.mu-html-tag` : `span.${imageClass}.mu-html-tag`
  selector += `.mu-output-remove`
  if (isSuccess) {
    selector += `.${className}`
  } else {
    selector += `.mu-image-fail`
  }

  return isSuccess
    ? [
      h(selector, tag),
      h(`img.mu-copy-remove`, { props: { alt, src } })
    ]
    : [h(selector, tag)]
}
