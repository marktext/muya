class Ui {
  constructor (muya) {
    this.muya = muya
    this.shownFloat = new Set()
    this.listen()
  }

  listen () {
    // cache shown float box
    this.muya.eventCenter.subscribe('muya-float', (tool, status) => {
      status ? this.shownFloat.add(tool) : this.shownFloat.delete(tool)
    })
  }

  hideAllFloatTools () {
    for (const tool of this.shownFloat) {
      tool.hide()
    }
  }
}

export default Ui
