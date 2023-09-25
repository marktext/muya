import Parent from "@muya/block/base/parent";
import ScrollPage from "@muya/block/scrollPage";
import logger from "@muya/utils/logger";
import { TState } from "../../../state/types";

const debug = logger("htmlContainer:");

class HTMLContainer extends Parent {
  static blockName = "html-container";

  static create(muya, state) {
    const htmlContainer = new HTMLContainer(muya, state);

    const code = ScrollPage.loadBlock("code").create(muya, state);

    htmlContainer.append(code);

    return htmlContainer;
  }

  get lang() {
    return "markup";
  }

  get path() {
    const { path: pPath } = this.parent;

    return [...pPath];
  }

  constructor(muya, state?) {
    super(muya);
    this.tagName = "pre";
    this.classList = ["mu-html-container"];
    this.createDomNode();
  }

  getState(): TState {
    debug.warn("You can never call `getState` in htmlContainer");
    return;
  }
}

export default HTMLContainer;
