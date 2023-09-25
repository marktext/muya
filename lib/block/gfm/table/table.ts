import Parent from "@muya/block/base/parent";
import ContainerQueryBlock from "@muya/block/mixins/containerQueryBlock";
import ScrollPage from "@muya/block/scrollPage";
import { mixins } from "@muya/utils";
import { ITableState } from "../../../state/types";

@mixins(ContainerQueryBlock)
class TableInner extends Parent {
  static blockName = "table.inner";

  static create(muya, state) {
    const table = new TableInner(muya, state);

    table.append(
      ...state.children.map((child) =>
        ScrollPage.loadBlock("table.row").create(muya, child)
      )
    );

    return table;
  }

  get path() {
    return [...this.parent.path, "children"];
  }

  constructor(muya, state?) {
    super(muya);
    this.tagName = "table";

    this.classList = ["mu-table-inner"];
    this.createDomNode();
  }

  getState(): ITableState {
    const state: ITableState = {
      name: "table",
      children: this.map((node) => node.getState()),
    };

    return state;
  }
}

export default TableInner;
