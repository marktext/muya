// @ts-nocheck
import Parent from "@muya/block/base/parent";
import ScrollPage from "@muya/block/scrollPage";
import { mixins } from "@muya/utils";
import leafQueryBlock from "@muya/block/mixins/leafQueryBlock";
import { ITableCellMeta, ITableCellState } from "../../../../types/state";

class TableBodyCell extends Parent {
  public meta: ITableCellMeta;

  static blockName = "table.cell";

  static create(muya, state) {
    const cell = new TableBodyCell(muya, state);

    cell.append(
      ScrollPage.loadBlock("table.cell.content").create(muya, state.text)
    );

    return cell;
  }

  get path() {
    const { path: pPath } = this.parent;
    const offset = this.parent.offset(this);

    return [...pPath, "children", offset];
  }

  get table() {
    return this.closestBlock("table");
  }

  get row() {
    return this.closestBlock("table.row");
  }

  get rowOffset() {
    return (this.table.firstChild as any).offset(this.row);
  }

  get columnOffset() {
    return this.row.offset(this);
  }

  get align() {
    return this.meta.align;
  }

  set align(value) {
    this.domNode.dataset.align = value;
    this.meta.align = value;
  }

  constructor(muya, { meta }) {
    super(muya);
    this.tagName = "td";
    this.meta = meta;
    this.datasets = {
      align: meta.align,
    };
    this.classList = ["mu-table-cell"];
    this.createDomNode();
  }

  getState(): ITableCellState {
    const state: ITableCellState = {
      name: "table.cell",
      meta: { ...this.meta },
      text: (this.firstChild as any).text,
    };

    return state;
  }
}

mixins(TableBodyCell, leafQueryBlock);

export default TableBodyCell;
