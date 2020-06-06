import PageBlock from '@/block/pageBlock'
import Selection from '@/selection'
import Search from '@/search'
import History from '@/history'

class Editor {
  constructor (muya) {
    this.muya = muya
    this.selection = new Selection(muya)
    this.search = new Search(muya)
    this.history = new History(muya)
    this.pageBlock = new PageBlock()
  }
}

export default Editor
