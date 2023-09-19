import Parent from "@muya/block/base/parent";
import ScrollPage from "@muya/block/scrollPage";
import { mixin } from "@muya/utils";
import LeafQueryBlock from "@muya/block/mixins/leafQueryBlock";
import { IThematicBreakState } from "../../../../types/state";
import Muya from "@muya/index";
import ThematicBreakContent from "@muya/block/content/thematicBreakContent";

@mixin(LeafQueryBlock)
class ThematicBreak extends Parent {
  static blockName = "thematic-break";

  static create(muya: Muya, state: IThematicBreakState) {
    const heading = new ThematicBreak(muya);

    heading.append(
      ScrollPage.loadBlock("thematicbreak.content").create(muya, state.text)
    );

    return heading;
  }

  get path() {
    const { path: pPath } = this.parent!;
    const offset = this.parent!.offset(this);

    return [...pPath, offset];
  }

  constructor(muya: Muya) {
    super(muya);
    this.tagName = "p";
    this.classList = ["mu-thematic-break"];
    this.createDomNode();
  }

  getState(): IThematicBreakState {
    return {
      name: "thematic-break",
      text: (this.children.head as ThematicBreakContent).text,
    };
  }
}

export default ThematicBreak;
