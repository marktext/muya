import ScrollPage from '@/block'
import Selection from '@/selection'
import Search from '@/search'
import History from '@/history'
import JSONState from '@/jsonState'
import InlineRenderer from '@/inlineRenderer'
import { DEFAULT_STATE } from '@/config'

class Editor {
  constructor (muya) {
    const state = muya.options.json || DEFAULT_STATE
    this.muya = muya
    this.jsonState = new JSONState(muya, state)
    this.inlineRenderer = new InlineRenderer(muya)
    this.selection = new Selection(muya)
    this.search = new Search(muya)
    this.history = new History(muya)
    // TODO: Maybe should not place selectedImage here?
    this.selectedImage = null
  }

  init () {
    const { muya } = this
    const state = muya.options.json || DEFAULT_STATE
    this.scrollPage = ScrollPage.create(muya, state)

    // TODO, the cursor maybe passed by muya options.cursor, and no need to find the first leaf block.
    const firstLeafBlock = this.scrollPage.firstContentInDescendant()

    const cursor = {
      path: firstLeafBlock.path,
      block: firstLeafBlock,
      anchor: {
        offset: 0
      },
      focus: {
        offset: 0
      }
    }

    if (firstLeafBlock.checkNeedRender(cursor)) {
      firstLeafBlock.update(cursor)
    }

    this.selection.setSelection(cursor)
    this.exportAPI()
  }

  exportAPI () {
    const apis = {
      jsonState: ['getState', 'getMarkdown']
    }

    Object.keys(apis).forEach(key => {
      for (const api of apis[key]) {
        this[api] = this[key][api].bind(this[key])
      }
    })
  }
}

export default Editor
