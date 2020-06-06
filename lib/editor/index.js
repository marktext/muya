import ScrollPage from '@/block'
import Selection from '@/selection'
import Search from '@/search'
import History from '@/history'
import JSONState from '@/jsonState'
import { DEFAULT_STATE } from '@/config'

class Editor {
  constructor (muya) {
    this.muya = muya
    const state = muya.options.json || DEFAULT_STATE
    this.scrollPage = ScrollPage.create(muya, state)
    this.jsonState = new JSONState(muya, state)
    this.selection = new Selection(muya)
    this.search = new Search(muya)
    this.history = new History(muya)

    this.exportAPI()
  }

  exportAPI () {
    const apis = {
      jsonState: ['getState']
    }

    Object.keys(apis).forEach(key => {
      for (const api of apis[key]) {
        this[api] = this[key][api].bind(this[key])
      }
    })
  }
}

export default Editor
