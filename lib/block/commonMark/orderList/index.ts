import Parent from "@muya/block/base/parent";
import ScrollPage from "@muya/block/scrollPage";
import { mixins } from "@muya/utils";
import ContainerQueryBlock from "@muya/block/mixins/containerQueryBlock";
import { IOrderListState } from "../../../jsonState/types";

interface IOrderListMeta {
  start: number;
  loose: boolean;
  delimiter: "." | ")";
}

@mixins(ContainerQueryBlock)
class OrderList extends Parent {
  public meta: IOrderListMeta;

  static blockName = "order-list";

  static create(muya, state) {
    const orderList = new OrderList(muya, state);

    orderList.append(
      ...state.children.map((child) =>
        ScrollPage.loadBlock(child.name).create(muya, child)
      )
    );

    return orderList;
  }

  get path() {
    const { path: pPath } = this.parent;
    const offset = this.parent.offset(this);

    return [...pPath, offset, "children"];
  }

  constructor(muya, { meta }) {
    super(muya);
    this.tagName = "ol";
    this.meta = meta;
    this.attributes = { start: meta.start };
    this.datasets = { delimiter: meta.delimiter };
    this.classList = ["mu-order-list"];
    if (!meta.loose) {
      this.classList.push("mu-tight-list");
    }
    this.createDomNode();
  }

  getState(): IOrderListState {
    const state: IOrderListState = {
      name: "order-list",
      meta: { ...this.meta },
      children: this.children.map((child) => child.getState()),
    };

    return state;
  }
}

export default OrderList;
