import Selection from '../selection'

class Editor {
  constructor (muya) {
    this.muya = muya
    this.selection = new Selection(muya)
  }
}

export default Editor
