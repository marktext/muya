// @ts-nocheck
import Parent from "@muya/block/base/parent";
import ScrollPage from "@muya/block/scrollPage";
import { mixins } from "@muya/utils";
import leafQueryBlock from "@muya/block/mixins/leafQueryBlock";
import { ISetextHeadingState } from "../../../../types/state";

interface ISetextHeadingMeta {
  level: number;
  underline: "===" | "---";
}

class SetextHeading extends Parent {
  public meta: ISetextHeadingMeta;

  static blockName = "setext-heading";

  static create(muya, state) {
    const heading = new SetextHeading(muya, state);

    heading.append(
      ScrollPage.loadBlock("setextheading.content").create(muya, state.text)
    );

    return heading;
  }

  get path() {
    const { path: pPath } = this.parent;
    const offset = this.parent.offset(this);

    return [...pPath, offset];
  }

  constructor(muya, { meta }) {
    super(muya);
    this.tagName = `h${meta.level}`;
    this.meta = meta;
    this.classList = ["mu-setext-heading"];
    this.createDomNode();
  }

  getState(): ISetextHeadingState {
    return {
      name: "setext-heading",
      meta: this.meta,
      text: (this.children.head as any).text,
    };
  }
}

mixins(SetextHeading, leafQueryBlock);

export default SetextHeading;
