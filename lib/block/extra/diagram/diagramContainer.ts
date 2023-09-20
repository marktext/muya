// @ts-nocheck
import Parent from "@muya/block/base/parent";
import ScrollPage from "@muya/block/scrollPage";
import { IDiagramMeta, TState } from "../../../jsonState/types";
import logger from "@muya/utils/logger";

const debug = logger("diagramContainer:");

class DiagramContainer extends Parent {
  public meta: IDiagramMeta;
  static blockName = "diagram-container";

  static create(muya, state) {
    const diagramContainer = new DiagramContainer(muya, state);

    const code = ScrollPage.loadBlock("code").create(muya, state);

    diagramContainer.append(code);

    return diagramContainer;
  }

  get lang() {
    return this.meta.lang;
  }

  get path() {
    const { path: pPath } = this.parent;

    return [...pPath];
  }

  constructor(muya, { meta }) {
    super(muya);
    this.tagName = "pre";
    this.meta = meta;
    this.classList = ["mu-diagram-container"];
    this.createDomNode();
  }

  getState(): TState {
    debug.warn("You can never call `getState` in diagramContainer");
    return;
  }
}

export default DiagramContainer;
