// @ts-nocheck
import Parent from "@muya/block/base/parent";
import ScrollPage from "@muya/block/scrollPage";
import { mixins } from "@muya/utils";
import leafQueryBlock from "@muya/block/mixins/leafQueryBlock";
import { IParagraphState } from "../../../../types/state";

class Paragraph extends Parent {
  static blockName = "paragraph";

  static create(muya, state) {
    const paragraph = new Paragraph(muya);

    paragraph.append(
      ScrollPage.loadBlock("paragraph.content").create(muya, state.text)
    );

    return paragraph;
  }

  get path() {
    const { path: pPath } = this.parent;
    const offset = this.parent.offset(this);

    return [...pPath, offset];
  }

  constructor(muya) {
    super(muya);
    this.tagName = "p";
    this.classList = ["mu-paragraph"];
    this.createDomNode();
  }

  getState(): IParagraphState {
    return {
      name: "paragraph",
      text: (this.children.head as any).text,
    };
  }
}

mixins(Paragraph, leafQueryBlock);

export default Paragraph;
