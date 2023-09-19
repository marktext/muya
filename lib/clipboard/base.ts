import Muya from "@muya/index";

abstract class Base {
  get selection() {
    return this.muya.editor.selection;
  }

  get scrollPage() {
    return this.muya.editor.scrollPage;
  }

  constructor(public muya: Muya) {}
}

export default Base;
