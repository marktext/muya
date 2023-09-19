import Parent from "@muya/block/base/parent";
import ScrollPage from "@muya/block/scrollPage";
import { mixin } from "@muya/utils";
import ContainerQueryBlock from "@muya/block/mixins/containerQueryBlock";
import { IBlockQuoteState } from "../../../../types/state";
import Muya from "@muya/index";

@mixin(ContainerQueryBlock)
class BlockQuote extends Parent {
  static blockName = "block-quote";

  static create(muya: Muya, state: IBlockQuoteState) {
    const blockQuote = new BlockQuote(muya);

    for (const child of state.children) {
      blockQuote.append(ScrollPage.loadBlock(child.name).create(muya, child));
    }

    return blockQuote;
  }

  get path() {
    const { path: pPath } = this.parent!;
    const offset = this.parent!.offset(this);

    return [...pPath, offset, "children"];
  }

  constructor(muya: Muya) {
    super(muya);
    this.tagName = "blockquote";
    this.classList = ["mu-block-quote"];
    this.createDomNode();
  }

  getState(): IBlockQuoteState {
    const state: IBlockQuoteState = {
      name: "block-quote",
      children: this.children.map((child) => (child as Parent).getState()),
    };

    return state;
  }
}

export default BlockQuote;
