import Parent from "@muya/block/base/parent";
import ScrollPage from "@muya/block/scrollPage";
import { mixins } from "@muya/utils";
import ContainerQueryBlock from "@muya/block/mixins/containerQueryBlock";
import { IBulletListState, IListItemState } from "@muya/jsonState/types";
import Muya from "@muya/index";

interface IBulletListMeta {
  marker: "-" | "+" | "*";
  loose: boolean;
}

@mixins(ContainerQueryBlock)
class BulletList extends Parent {
  static blockName = "bullet-list";

  static create(muya: Muya, state: IBulletListState) {
    const bulletList = new BulletList(muya, state);

    bulletList.append(
      ...state.children.map((child) =>
        ScrollPage.loadBlock(child.name).create(muya, child)
      )
    );

    return bulletList;
  }

  get path() {
    const { path: pPath } = this.parent!;
    const offset = this.parent!.offset(this);

    return [...pPath, offset, "children"];
  }

  public meta: IBulletListMeta;

  constructor(muya: Muya, { meta }: IBulletListState) {
    super(muya);
    this.tagName = "ul";
    this.meta = meta;
    this.datasets = {
      marker: meta.marker,
    };
    this.classList = ["mu-bullet-list"];
    if (!meta.loose) {
      this.classList.push("mu-tight-list");
    }
    this.createDomNode();
  }

  getState(): IBulletListState {
    const state: IBulletListState = {
      name: "bullet-list",
      meta: { ...this.meta },
      children: this.children.map((child) =>
        (child as Parent).getState()
      ) as IListItemState[],
    };

    return state;
  }
}

export default BulletList;
