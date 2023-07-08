// TODO@jocs: remove the use of `axios` in muya
import axios from 'axios'
import { isWin } from '@/config'
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
    if (isUrl) {
      return {
        isUnknownType: false,
        src
      }
    } else {
      return {
        isUnknownType: false,
        src: 'file://' + src
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

export const loadImage = async (url, detectContentType = false) => {
  if (detectContentType) {
    const isImage = await checkImageContentType(url)
    if (!isImage) throw new Error('not an image')
  }

  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      resolve({
        url,
        width: image.width,
        height: image.height
      })
    }

    image.onerror = err => {
      reject(err)
    }
    image.src = url
  })
}

export const checkImageContentType = async url => {
  try {
    const res = await axios.head(url)
    const contentType = res.headers['content-type']
    if (res.status === 200 && /^image\/(?:jpeg|png|gif|svg\+xml|webp)$/.test(contentType)) {
      return true
    }

    return false
  } catch (err) {
    return false
  }
}

export const correctImageSrc = src => {
  if (src) {
    // Fix ASCII and UNC paths on Windows (#1997).
    if (isWin && /^(?:[a-zA-Z]:\\|[a-zA-Z]:\/).+/.test(src)) {
      src = 'file:///' + src.replace(/\\/g, '/')
    } else if (isWin && /^\\\\\?\\.+/.test(src)) {
      src = 'file:///' + src.substring(4).replace(/\\/g, '/')
    } else if (/^\/.+/.test(src)) {
      // Also adding file protocol on UNIX.
      src = src
    }
  }

  return src
}
