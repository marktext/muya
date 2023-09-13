// @ts-nocheck
import Parent from "@muya/block/base/parent";
import ScrollPage from "@muya/block/scrollPage";
import { mixins } from "@muya/utils";
import containerQueryBlock from "@muya/block/mixins/containerQueryBlock";
import { IBlockQuoteState } from "../../../../types/state";

class BlockQuote extends Parent {
  static blockName = "block-quote";

  static create(muya, state) {
    const blockQuote = new BlockQuote(muya, state);

    for (const child of state.children) {
      blockQuote.append(ScrollPage.loadBlock(child.name).create(muya, child));
    }

    return blockQuote;
  }

  get path() {
    const { path: pPath } = this.parent;
    const offset = this.parent.offset(this);

    return [...pPath, offset, "children"];
  }

  constructor(muya, state?) {
    super(muya);
    this.tagName = "blockquote";
    this.classList = ["mu-block-quote"];
    this.createDomNode();
  }

  getState(): IBlockQuoteState {
    const state: IBlockQuoteState = {
      name: "block-quote",
      children: this.children.map((child) => child.getState()),
    };

    return state;
  }
}

mixins(BlockQuote, containerQueryBlock);

export default BlockQuote;
