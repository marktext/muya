// @ts-nocheck
import Parent from "@muya/block/base/parent";
import ScrollPage from "@muya/block/scrollPage";
import { mixins } from "@muya/utils";
import leafQueryBlock from "@muya/block/mixins/leafQueryBlock";
import { IThematicBreakState } from "../../../../types/state";

class ThematicBreak extends Parent {
  static blockName = "thematic-break";

  static create(muya, state) {
    const heading = new ThematicBreak(muya, state);

    heading.append(
      ScrollPage.loadBlock("thematicbreak.content").create(muya, state.text)
    );

    return heading;
  }

  get path() {
    const { path: pPath } = this.parent;
    const offset = this.parent.offset(this);

    return [...pPath, offset];
  }

  constructor(muya, state?) {
    super(muya);
    this.tagName = "p";
    this.classList = ["mu-thematic-break"];
    this.createDomNode();
  }

  getState(): IThematicBreakState {
    return {
      name: "thematic-break",
      text: (this.children.head as any).text,
    };
  }
}

mixins(ThematicBreak, leafQueryBlock);

export default ThematicBreak;
