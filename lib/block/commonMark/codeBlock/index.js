import diff from 'fast-diff'
import Parent from '@/block/base/parent'
import ScrollPage from '@/block/scrollPage'
import { diffToTextOp } from '@/utils'
import { loadLanguage } from '@/utils/prism'
import logger from '@/utils/logger'

const debug = logger('codeblock:')

class CodeBlock extends Parent {
  static blockName = 'code-block'

  static create (muya, state) {
    const codeBlock = new CodeBlock(muya, state)
    const { lang } = state.meta

    const langInput = ScrollPage.loadBlock('language-input').create(muya, state)
    const code = ScrollPage.loadBlock('code').create(muya, state)

    codeBlock.append(langInput)
    codeBlock.append(code)

    if (lang) {
      codeBlock.lang = lang
    }

    return codeBlock
  }

  get lang () {
    return this.meta.lang
  }

  set lang (value) {
    this.meta.lang = value

    if (this.meta.type !== 'fenced') {
      this.meta.type = 'fenced'
      // dispatch change to modify json state
      const diffs = diff('indented', 'fenced')
      const { path } = this
      path.push('meta', 'type')
      this.jsonState.pushOperation('editOp', path, 'text-unicode', diffToTextOp(diffs))
    }

    loadLanguage(value)
      .then(infoList => {
        if (!Array.isArray(infoList)) return
        // There are three status `loaded`, `noexist` and `cached`.
        // if the status is `loaded`, indicated that it's a new loaded language
        const needRender = infoList.some(({ status }) => status === 'loaded' || status === 'cached')
        if (needRender) {
          this.lastContentInDescendant().update()
        }
      })
      .catch(err => {
        // if no parameter provided, will cause error.
        debug.warn(err)
      })
  }

  get path () {
    const { path: pPath } = this.parent
    const offset = this.parent.offset(this)

    return [...pPath, offset]
  }

  constructor (muya, { meta }) {
    super(muya)
    this.tagName = 'pre'
    this.meta = meta
    this.classList = ['mu-code-block']
    this.createDomNode()
  }

  queryBlock (path) {
    return path.length && path[0] === 'text' ? this.lastContentInDescendant() : this
  }

  getState () {
    const state = {
      name: 'code-block',
      meta: { ...this.meta },
      text: this.lastContentInDescendant().text
    }

    return state
  }
}

export default CodeBlock
