import { sanitize } from '@/utils'
import { PREVIEW_DOMPURIFY_CONFIG, PARAGRAPH_TYPES } from '@/config'

const TIMEOUT = 1500

export const isOnline = () => navigator.onLine === true

export const getPageTitle = url => {
  // No need to request the title when it's not url.
  if (!url.startsWith('http')) {
    return ''
  }

  // No need to request the title when off line.
  if (!isOnline()) {
    return ''
  }

  const req = new XMLHttpRequest()
  let settle
  const promise = new Promise((resolve, reject) => {
    settle = resolve
  })
  const handler = () => {
    if (req.readyState === XMLHttpRequest.DONE) {
      if (req.status === 200) {
        const contentType = req.getResponseHeader('Content-Type')
        if (/text\/html/.test(contentType)) {
          const { response } = req
          if (typeof response === 'string') {
            const match = response.match(/<title>(.*)<\/title>/)

            return match && match[1] ? settle(match[1]) : settle('')
          }

          return settle('')
        }

        return settle('')
      } else {
        return settle('')
      }
    }
  }

  const handleError = (e) => {
    settle('')
  }
  req.open('GET', url)
  req.onreadystatechange = handler
  req.onerror = handleError
  req.send()

  // Resolve empty string when `TIMEOUT` passed.
  const timer = new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve('')
    }, TIMEOUT)
  })

  return Promise.race([promise, timer])
}

export const normalizePastedHTML = async function (html) {
  // Only extract the `body.innerHTML` when the `html` is a full HTML Document.
  if (/<body>[\s\S]*<\/body>/.test(html)) {
    const match = /<body>([\s\S]*)<\/body>/.exec(html)
    if (match && typeof match[1] === 'string') {
      html = match[1]
    }
  }

  // Prevent XSS and sanitize HTML.
  const sanitizedHtml = sanitize(html, PREVIEW_DOMPURIFY_CONFIG)
  const tempWrapper = document.createElement('div')
  tempWrapper.innerHTML = sanitizedHtml

  // Special process for turndown.js, needed for Number app on macOS.
  const tables = Array.from(tempWrapper.querySelectorAll('table'))

  for (const table of tables) {
    const row = table.querySelector('tr')
    if (row.firstElementChild.tagName !== 'TH') {
      [...row.children].forEach(cell => {
        const th = document.createElement('th')
        th.innerHTML = cell.innerHTML
        cell.replaceWith(th)
      })
    }
    const paragraphs = Array.from(table.querySelectorAll('p'))

    for (const p of paragraphs) {
      const span = document.createElement('span')
      span.innerHTML = p.innerHTML
      p.replaceWith(span)
    }

    const tds = table.querySelectorAll('td')

    for (const td of tds) {
      const rawHtml = td.innerHTML
      if (/<br>/.test(rawHtml)) {
        td.innerHTML = rawHtml.replace(/<br>/g, '&lt;br&gt;')
      }
    }
  }

  // Prevent it parse into a link if copy a url.
  const links = Array.from(tempWrapper.querySelectorAll('a'))

  for (const link of links) {
    const href = link.getAttribute('href')
    const text = link.textContent

    if (href === text) {
      const title = await getPageTitle(href)
      if (title) {
        link.textContent = title
      } else {
        const span = document.createElement('span')
        span.innerHTML = text
        link.replaceWith(span)
      }
    }
  }

  return tempWrapper.innerHTML
}

export const checkCopyType = function (html, text) {
  let type = 'normal'

  if (!html && text) {
    type = 'copyAsMarkdown'
    const match = /^<([a-zA-Z\d-]+)(?=\s|>).*?>[\s\S]+?<\/([a-zA-Z\d-]+)>$/.exec(text.trim())
    if (match && match[1]) {
      const tag = match[1]
      if (tag === 'table' && match.length === 3 && match[2] === 'table') {
        // Try to import a single table
        const tmp = document.createElement('table')
        tmp.innerHTML = text
        if (tmp.childElementCount === 1) {
          return 'htmlToMd'
        }
      }

      // TODO: We could try to import HTML elements such as headings, text and lists to markdown for better UX.
      type = PARAGRAPH_TYPES.find(type => type === tag) ? 'copyAsHtml' : type
    }
  }

  return type
}
