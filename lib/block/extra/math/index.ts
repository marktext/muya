import Parent from "@muya/block/base/parent";
import ScrollPage from "@muya/block/scrollPage";
import { Path } from "@muya/block/types";
import Muya from "@muya/index";
import { IMathBlockState, IMathMeta } from "../../../state/types";

class MathBlock extends Parent {
  public meta: IMathMeta;

  static blockName = "math-block";

  static create(muya: Muya, state: IMathBlockState) {
    const mathBlock = new MathBlock(muya, state);

    const mathPreview = ScrollPage.loadBlock("math-preview").create(
      muya,
      state
    );
    const mathContainer = ScrollPage.loadBlock("math-container").create(
      muya,
      state
    );

    mathBlock.appendAttachment(mathPreview);
    mathBlock.append(mathContainer);

    return mathBlock;
  }

  get path() {
    const { path: pPath } = this.parent!;
    const offset = this.parent!.offset(this);

    return [...pPath, offset];
  }

  constructor(muya: Muya, { meta }: IMathBlockState) {
    super(muya);
    this.tagName = "figure";
    this.meta = meta;
    this.classList = ["mu-math-block"];
    this.createDomNode();
  }

  queryBlock(path: Path) {
    return path.length && path[0] === "text"
      ? this.firstContentInDescendant()
      : this;
  }

  getState(): IMathBlockState {
    const { meta } = this;
    const { text } = this.firstContentInDescendant();

    return {
      name: "math-block",
      text,
      meta,
    };
  }
}

export default MathBlock;
