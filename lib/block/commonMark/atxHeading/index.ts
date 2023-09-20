import Parent from "@muya/block/base/parent";
import ScrollPage from "@muya/block/scrollPage";
import { mixin } from "@muya/utils";
import LeafQueryBlock from "@muya/block/mixins/leafQueryBlock";
import { IAtxHeadingState } from "../../../jsonState/types";
import Muya from "@muya/index";
import Content from "@muya/block/base/content";

interface IAtxHeadingMeta {
  level: number;
}

@mixin(LeafQueryBlock)
class AtxHeading extends Parent {
  public meta: IAtxHeadingMeta;

  static blockName = "atx-heading";

  static create(muya: Muya, state: IAtxHeadingState) {
    const heading = new AtxHeading(muya, state);

    heading.append(
      ScrollPage.loadBlock("atxheading.content").create(muya, state.text)
    );

    return heading;
  }

  get path() {
    const { path: pPath } = this.parent!;
    const offset = this.parent!.offset(this);

    return [...pPath, offset];
  }

  constructor(muya: Muya, { meta }: IAtxHeadingState) {
    super(muya);
    this.tagName = `h${meta.level}`;
    this.meta = meta;
    this.classList = ["mu-atx-heading"];
    this.createDomNode();
  }

  getState(): IAtxHeadingState {
    return {
      name: "atx-heading",
      meta: this.meta,
      text: (this.children.head as Content).text,
    };
  }
}

export default AtxHeading;
