import Parent from '@/block/base/parent'
import ScrollPage from '@/block/scrollPage'
import { loadLanguage } from '@/utils/prism'
import logger from '@/utils/logger'

const debug = logger('diagram:')

class DiagramBlock extends Parent {
  static blockName = 'diagram'

  static create (muya, state) {
    const diagramBlock = new DiagramBlock(muya, state)
    const { lang } = state.meta
    const diagramPreview = ScrollPage.loadBlock('diagram-preview').create(muya, state)
    const diagramContainer = ScrollPage.loadBlock('diagram-container').create(muya, state)

    diagramBlock.appendAttachment(diagramPreview)
    diagramBlock.append(diagramContainer)

    loadLanguage(lang)
      .then(infoList => {
        if (!Array.isArray(infoList)) return
        // There are three status `loaded`, `noexist` and `cached`.
        // if the status is `loaded`, indicated that it's a new loaded language
        const needRender = infoList.some(({ status }) => status === 'loaded' || status === 'cached')
        if (needRender) {
          diagramBlock.lastContentInDescendant().update()
        }
      })
      .catch(err => {
      // if no parameter provided, will cause error.
        debug.warn(err)
      })

    return diagramBlock
  }

  get path () {
    const { path: pPath } = this.parent
    const offset = this.parent.offset(this)

    return [...pPath, offset]
  }

  constructor (muya, { meta }) {
    super(muya)
    this.tagName = 'figure'
    this.meta = meta
    this.classList = ['mu-diagram-block']
    this.createDomNode()
  }

  queryBlock (path) {
    return path.length && path[0] === 'text' ? this.firstContentInDescendant() : this
  }

  getState () {
    const { meta, blockName: name } = this
    const { text } = this.firstContentInDescendant()

    return {
      name,
      text,
      meta
    }
  }
}

export default DiagramBlock
