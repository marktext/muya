import Parent from "@muya/block/base/parent";
import ScrollPage from "@muya/block/scrollPage";
import { mixin } from "@muya/utils";
import LeafQueryBlock from "@muya/block/mixins/leafQueryBlock";
import { ISetextHeadingState } from "../../../jsonState/types";
import SetextHeadingContent from "@muya/block/content/setextHeadingContent";
import Muya from "@muya/index";

interface ISetextHeadingMeta {
  level: number;
  underline: "===" | "---";
}

@mixin(LeafQueryBlock)
class SetextHeading extends Parent {
  public meta: ISetextHeadingMeta;

  static blockName = "setext-heading";

  static create(muya: Muya, state: ISetextHeadingState) {
    const heading = new SetextHeading(muya, state);

    heading.append(
      ScrollPage.loadBlock("setextheading.content").create(muya, state.text)
    );

    return heading;
  }

  get path() {
    const { path: pPath } = this.parent!;
    const offset = this.parent!.offset(this);

    return [...pPath, offset];
  }

  constructor(muya: Muya, { meta }: ISetextHeadingState) {
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
      text: (this.children.head as SetextHeadingContent).text,
    };
  }
}

export default SetextHeading;
