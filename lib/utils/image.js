import { findContentDOM, getOffsetOfParagraph } from '@/selection/dom'
import { tokenizer } from '@/inlineRenderer/lexer'

export const getImageInfo = image => {
  const paragraph = findContentDOM(image)
  const raw = image.getAttribute('data-raw')
  const offset = getOffsetOfParagraph(image, paragraph)
  const tokens = tokenizer(raw)
  const token = tokens[0]
  token.range = {
    start: offset,
    end: offset + raw.length
  }

  return {
    key: paragraph.id,
    token,
    imageId: image.id
  }
}

export const getImageSrc = src => {
  const EXT_REG = /\.(jpeg|jpg|png|gif|svg|webp)(?=\?|$)/i
  // http[s] (domain or IPv4 or localhost or IPv6) [port] /not-white-space
  const URL_REG = /^http(s)?:\/\/([a-z0-9\-._~]+\.[a-z]{2,}|[0-9.]+|localhost|\[[a-f0-9.:]+\])(:[0-9]{1,5})?\/[\S]+/i
  const DATA_URL_REG = /^data:image\/[\w+-]+(;[\w-]+=[\w-]+|;base64)*,[a-zA-Z0-9+/]+={0,2}$/
  const imageExtension = EXT_REG.test(src)
  const isUrl = URL_REG.test(src)
  if (imageExtension) {
    if (isUrl || !window.DIRNAME) {
      return {
        isUnknownType: false,
        src
      }
    } else if (window && window.process && window.process.type === 'renderer') {
      return {
        isUnknownType: false,
        src: 'file://' + require('path').resolve(window.DIRNAME, src)
      }
    }
  } else if (isUrl && !imageExtension) {
    return {
      isUnknownType: true,
      src
    }
  } else {
    const isDataUrl = DATA_URL_REG.test(src)
    if (isDataUrl) {
      return {
        isUnknownType: false,
        src
      }
    } else {
      return {
        isUnknownType: false,
        src: ''
      }
    }
  }
}
