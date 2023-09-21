import Muya from "../index";

class Ui {
  public muya: Muya;
  public shownFloat: Set<any>;
  public shownButton: Set<any>;

  constructor(muya) {
    this.muya = muya;
    this.shownFloat = new Set();
    this.shownButton = new Set();
    this.listen();
  }

  listen() {
    // cache shown float box
    this.muya.eventCenter.subscribe("muya-float", (tool, status) => {
      status ? this.shownFloat.add(tool) : this.shownFloat.delete(tool);
    });
    // cache shown btn
    this.muya.eventCenter.subscribe("muya-float-button", (tool, status) => {
      status ? this.shownButton.add(tool) : this.shownButton.delete(tool);
    });
  }

  hideAllFloatTools() {
    for (const tool of this.shownFloat) {
      tool.hide();
    }

    for (const btn of this.shownButton) {
      btn.hide();
    }
  }
}

export default Ui;
