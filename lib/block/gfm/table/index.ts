import Parent from "@muya/block/base/parent";
import ScrollPage from "@muya/block/scrollPage";
import { diffToTextOp } from "@muya/utils";
import logger from "@muya/utils/logger";
import diff from "fast-diff";
import { ITableState } from "../../../state/types";

const debug = logger("table:");

class Table extends Parent {
  static blockName = "table";

  static create(muya, state) {
    const table = new Table(muya, state);

    table.append(ScrollPage.loadBlock("table.inner").create(muya, state));

    return table;
  }

  static createWithRowAndColumn(muya, row, column) {
    // TODO
  }

  static createWithHeader(muya, header) {
    const state = {
      name: "table",
      children: [
        {
          name: "table.row",
          children: header.map((c) => ({
            name: "table.cell",
            meta: { align: "none" },
            text: c,
          })),
        },
        {
          name: "table.row",
          children: header.map((_) => ({
            name: "table.cell",
            meta: { align: "none" },
            text: "",
          })),
        },
      ],
    };

    return this.create(muya, state);
  }

  get path() {
    const { path: pPath } = this.parent;
    const offset = this.parent.offset(this);

    return [...pPath, offset];
  }

  get isEmpty() {
    const state = this.getState();

    return state.children.every((row) =>
      row.children.every((cell) => cell.text === "")
    );
  }

  get rowCount() {
    return (this.firstChild as any).length();
  }

  get columnCount() {
    return (this.firstChild as any).firstChild.length();
  }

  constructor(muya, state?) {
    super(muya);
    this.tagName = "figure";

    this.classList = ["mu-table"];
    this.createDomNode();
    this.listenDomEvent();
  }

  listenDomEvent() {
    const { eventCenter } = this.muya;
    const { domNode } = this;

    // Fix: prevent cursor present at the end of table.
    const clickHandler = (event) => {
      if (event.target === domNode) {
        event.preventDefault();
        const cursorBlock = this.lastContentInDescendant();
        const offset = cursorBlock.text.length;
        cursorBlock.setCursor(offset, offset, true);
      }
    };
    eventCenter.attachDOMEvent(domNode, "mousedown", clickHandler);
  }

  queryBlock(path) {
    return (this.firstChild as any).queryBlock(path);
  }

  empty() {
    const { isEmpty } = this;
    if (isEmpty) {
      return;
    }

    const table: any = this.firstChild;
    table.forEach((row) => {
      row.forEach((cell) => {
        cell.firstChild.text = "";
      });
    });
  }

  insertRow(offset) {
    const { columnCount } = this;
    const firstRowState = this.getState().children[0];
    const currentRow =
      offset > 0
        ? (this.firstChild as any).find(offset - 1)
        : (this.firstChild as any).find(offset);
    const state = {
      name: "table.row",
      children: [...new Array(columnCount)].map((_, i) => {
        return {
          name: "table.cell",
          meta: {
            align: firstRowState.children[i].meta.align,
          },
          text: "",
        };
      }),
    };

    const rowBlock = ScrollPage.loadBlock("table.row").create(this.muya, state);

    if (offset > 0) {
      (this.firstChild as any).insertAfter(rowBlock, currentRow);
    } else {
      (this.firstChild as any).insertBefore(rowBlock, currentRow);
    }

    return rowBlock.firstContentInDescendant();
  }

  insertColumn(offset, align = "none") {
    const tableInner: any = this.firstChild;
    let firstCellInNewColumn = null;
    tableInner.forEach((row) => {
      const state = {
        name: "table.cell",
        meta: { align },
        text: "",
      };
      const cell = ScrollPage.loadBlock("table.cell").create(this.muya, state);
      const ref = row.find(offset);
      row.insertBefore(cell, ref);
      if (!firstCellInNewColumn) {
        firstCellInNewColumn = cell;
      }
    });

    return firstCellInNewColumn.firstChild;
  }

  removeRow(offset) {
    const row = (this.firstChild as any).find(offset);
    row.remove();
  }

  removeColumn(offset) {
    const { columnCount } = this;
    if (offset < 0 || offset >= columnCount) {
      debug.warn(`column at ${offset} is not existed.`);
    }

    const table: any = this.firstChild;
    if (this.columnCount === 1) {
      return this.remove();
    }

    table.forEach((row) => {
      const cell = row.find(offset);
      if (cell) {
        cell.remove();
      }
    });
  }

  alignColumn(offset, value) {
    const { columnCount } = this;
    if (offset < 0 || offset >= columnCount) {
      debug.warn(`Column at ${offset} is not existed.`);
    }
    const table: any = this.firstChild;
    table.forEach((row) => {
      const cell = row.find(offset);
      if (cell) {
        const { align: oldValue } = cell;
        cell.align = oldValue === value ? "none" : value;
        // dispatch change to modify json state
        const diffs = diff(oldValue, cell.align);
        const { path } = cell;
        path.push("meta", "align");
        this.jsonState.pushOperation(
          "editOp",
          path,
          "text-unicode",
          diffToTextOp(diffs)
        );
      }
    });
  }

  getState(): ITableState {
    return (this.firstChild as any).getState();
  }
}

export default Table;
