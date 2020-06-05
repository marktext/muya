import PageBlock from '@/block/pageBlock'
import Selection from '@/selection'

class Editor {
  constructor (muya) {
    this.muya = muya
    this.selection = new Selection(muya)
    this.pageBlock = new PageBlock()
    this.renderQueue = []
  }

  render () {
    for (const task of this.renderQueue) {
      task.render()
    }
  }
}

export default Editor
