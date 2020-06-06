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
    // for test
    setTimeout(() => {
      this.jsonState.dispatch(
        'editOp',
        {
          path: ['children', 0, 'children', 0, 'text'],
          op: [3, 'hello world']
        }
      )
    })
    this.selection = new Selection(muya)
    this.search = new Search(muya)
    this.history = new History(muya)
  }
}

export default Editor
