import Content from '@/block/base/content'
import prism, { loadedCache, transfromAliasToOrigin } from '@/utils/prism/'
import ScrollPage from '@/block/scrollPage'
import { getLongUniqueId, escapeHtml } from '@/utils'

const checkAutoIndent = (text, offset) => {
  const pairStr = text.substring(offset - 1, offset + 1)

  return /^(\{\}|\[\]|\(\)|><)$/.test(pairStr)
}

const getIndentSpace = text => {
  const match = /^(\s*)\S/.exec(text)

  return match ? match[1] : ''
}

// TODO: @jocs any better solutions?
const MARKER_HASK = {
  '<': `%${getLongUniqueId()}%`,
  '>': `%${getLongUniqueId()}%`,
  '"': `%${getLongUniqueId()}%`,
  "'": `%${getLongUniqueId()}%`
}

const getHighlightHtml = (text, highlights, escape = false, handleLineEnding = false) => {
  let code = ''
  let pos = 0
  const getEscapeHTML = (className, content) => {
    return `${MARKER_HASK['<']}span class=${MARKER_HASK['"']}${className}${MARKER_HASK['"']}${MARKER_HASK['>']}${content}${MARKER_HASK['<']}/span${MARKER_HASK['>']}`
  }

  for (const highlight of highlights) {
    const { start, end, active } = highlight
    code += text.substring(pos, start)
    const className = active ? 'mu-highlight' : 'mu-selection'
    let highlightContent = text.substring(start, end)
    if (handleLineEnding && text.endsWith('\n') && end === text.length) {
      highlightContent = highlightContent.substring(start, end - 1) +
      (escape
        ? getEscapeHTML('mu-line-end', '\n')
        : '<span class="mu-line-end">\n</span>')
    }
    code += escape
      ? getEscapeHTML(className, highlightContent)
      : `<span class="${className}">${highlightContent}</span>`
    pos = end
  }

  if (pos !== text.length) {
    if (handleLineEnding && text.endsWith('\n')) {
      code += text.substring(pos, text.length - 1) +
      (escape
        ? getEscapeHTML('mu-line-end', '\n')
        : '<span class="mu-line-end">\n</span>')
    } else {
      code += text.substring(pos)
    }
  }

  return code
}

class CodeBlockContent extends Content {
  static blockName = 'codeblock.content'

  static create (muya, state) {
    const content = new CodeBlockContent(muya, state)

    return content
  }

  get lang () {
    const { codeBlock } = this

    return codeBlock ? codeBlock.meta.lang : this.initialLang
  }

  get codeBlock () {
    return this.parent?.parent
  }

  constructor (muya, state) {
    super(muya, state.text)
    this.initialLang = state.meta.lang
    this.classList = [...this.classList, 'mu-codeblock-content']
    this.createDomNode()
  }

  update () {
    const { lang, text } = this
    // transfrom alias to original language
    const fullLengthLang = transfromAliasToOrigin([lang])[0]
    const domNode = this.domNode
    // TODO: UPDATE highlights when inplement search.
    const highlights = []
    const code = escapeHtml(getHighlightHtml(text, highlights, true, true))
      .replace(new RegExp(MARKER_HASK['<'], 'g'), '<')
      .replace(new RegExp(MARKER_HASK['>'], 'g'), '>')
      .replace(new RegExp(MARKER_HASK['"'], 'g'), '"')
      .replace(new RegExp(MARKER_HASK["'"], 'g'), "'")

    if (fullLengthLang && /\S/.test(code) && loadedCache.has(fullLengthLang)) {
      const wrapper = document.createElement('div')
      wrapper.classList.add(`language-${fullLengthLang}`)
      wrapper.innerHTML = code
      prism.highlightElement(wrapper, false, function () {
        domNode.innerHTML = this.innerHTML
      })
    } else {
      this.domNode.innerHTML = code
    }
  }

  inputHandler (event) {
    const textContent = this.domNode.textContent
    const { start, end } = this.getCursor()
    const { needRender, text } = this.autoPair(event, textContent, start, end, false, false, 'codeblock.content')
    this.text = text
    if (needRender) {
      this.setCursor(start.offset, end.offset, true)
    } else {
      // TODO: throttle render
      this.setCursor(start.offset, end.offset, true)
    }
  }

  enterHandler (event) {
    event.preventDefault()
    const { tabSize } = this.muya.options
    const { start } = this.getCursor()
    const { text } = this
    const autoIndent = checkAutoIndent(text, start.offset)
    const indent = getIndentSpace(text)

    this.text = text.substring(0, start.offset) +
      '\n' +
      (autoIndent ? indent + ' '.repeat(tabSize) + '\n' : '') +
      indent +
      text.substring(start.offset)

    let offset = start.offset + 1 + indent.length

    if (autoIndent) {
      offset += tabSize
    }

    this.setCursor(offset, offset, true)
  }

  backspaceHandler () {
    const { start, end } = this.getCursor()
    if (start.offset === end.offset && start.offset === 0) {
      const { text, muya } = this
      const state = {
        name: 'paragraph',
        text
      }
      const newNode = ScrollPage.loadBlock(state.name).create(muya, state)
      this.codeBlock.replaceWith(newNode)
      const cursorBlock = newNode.lastContentInDescendant()
      cursorBlock.setCursor(0, 0, true)
    }
  }

  keyupHandler () {
    const { anchor, focus } = this.getCursor()
    const { anchor: oldAnchor, focus: oldFocus } = this.selection

    if (anchor.offset !== oldAnchor.offset || focus.offset !== oldFocus.offset) {
      const cursor = { anchor, focus, block: this, path: this.path }

      this.selection.setSelection(cursor)
    }
  }
}

export default CodeBlockContent
