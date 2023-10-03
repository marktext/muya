import Parent from "@muya/block/base/parent";
import ScrollPage from "@muya/block/scrollPage";
import Muya from "@muya/index";
import logger from "@muya/utils/logger";
import { IHtmlBlockState, TState } from "../../../state/types";

const debug = logger("htmlContainer:");

class HTMLContainer extends Parent {
  static blockName = "html-container";

  static create(muya: Muya, state: IHtmlBlockState) {
    const htmlContainer = new HTMLContainer(muya);

    const code = ScrollPage.loadBlock("code").create(muya, state);

    htmlContainer.append(code);

    return htmlContainer;
  }

  get lang() {
    return "markup";
  }

  get path() {
    const { path: pPath } = this.parent!;

    return [...pPath];
  }

  constructor(muya: Muya) {
    super(muya);
    this.tagName = "pre";
    this.classList = ["mu-html-container"];
    this.createDomNode();
  }

  getState(): TState {
    debug.warn("You can never call `getState` in htmlContainer");
    return {} as TState;
  }
}

export default HTMLContainer;
