import Parent from "@muya/block/base/parent";
import ScrollPage from "@muya/block/scrollPage";
import { mixin } from "@muya/utils";
import LeafQueryBlock from "@muya/block/mixins/leafQueryBlock";
import { ITableCellMeta, ITableCellState } from "../../../jsonState/types";
import Muya from "@muya/index";
import TableCellContent from "@muya/block/content/tableCell";
import TableInner from "./table";
import Table from ".";
import Row from "./row";

@mixin(LeafQueryBlock)
class TableBodyCell extends Parent {
  public meta: ITableCellMeta;

  static blockName = "table.cell";

  static create(muya: Muya, state: ITableCellState) {
    const cell = new TableBodyCell(muya, state);

    cell.append(
      ScrollPage.loadBlock("table.cell.content").create(muya, state.text)
    );

    return cell;
  }

  get path() {
    const { path: pPath } = this.parent!;
    const offset = this.parent!.offset(this);

    return [...pPath, "children", offset];
  }

  get table() {
    return this.closestBlock("table") as Table;
  }

  get row() {
    return this.closestBlock("table.row") as Row;
  }

  get rowOffset() {
    return (this.table.firstChild as TableInner).offset(this.row);
  }

  get columnOffset() {
    return this.row!.offset(this);
  }

  get align() {
    return this.meta.align;
  }

  set align(value) {
    this.domNode!.dataset.align = value;
    this.meta.align = value;
  }

  constructor(muya: Muya, { meta }: ITableCellState) {
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
      text: (this.firstChild as TableCellContent).text,
    };

    return state;
  }
}

export default TableBodyCell;
