import Parent from "@muya/block/base/parent";
import ScrollPage from "@muya/block/scrollPage";
import { mixin } from "@muya/utils";
import LeafQueryBlock from "@muya/block/mixins/leafQueryBlock";
import { IParagraphState } from "../../../jsonState/types";
import Muya from "@muya/index";
import ParagraphContent from "@muya/block/content/paragraphContent";

@mixin(LeafQueryBlock)
class Paragraph extends Parent {
  static blockName = "paragraph";

  static create(muya: Muya, state: IParagraphState) {
    const paragraph = new Paragraph(muya);

    paragraph.append(
      ScrollPage.loadBlock("paragraph.content").create(muya, state.text)
    );

    return paragraph;
  }

  get path() {
    const { path: pPath } = this.parent!;
    const offset = this.parent!.offset(this);

    return [...pPath, offset];
  }

  constructor(muya: Muya) {
    super(muya);
    this.tagName = "p";
    this.classList = ["mu-paragraph"];
    this.createDomNode();
  }

  getState(): IParagraphState {
    return {
      name: "paragraph",
      text: (this.children.head as ParagraphContent).text,
    };
  }
}

export default Paragraph;
