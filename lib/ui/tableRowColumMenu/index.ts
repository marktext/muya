import BaseFloat from "../baseFloat";
import { patch, h } from "@muya/utils/snabbdom";
import { toolList } from "./config";

import "./index.css";
import { VNode } from "snabbdom";
import Muya from "@muya/index";

const defaultOptions = {
  placement: "bottom-center",
  modifiers: {
    offset: {
      offset: "0, 5",
    },
  },
  showArrow: false,
};

class TableBarTools extends BaseFloat {
  static pluginName = "tableBarTools";
  private oldVNode: VNode | null = null;
  private tableInfo: any;
  private block: any;
  private tableBarContainer: HTMLDivElement = document.createElement("div");

  constructor(muya: Muya, options = {}) {
    const name = "mu-table-bar-tools";
    const opts = Object.assign({}, defaultOptions, options);
    super(muya, name, opts);
    this.tableInfo = null;
    this.block = null;
    this.floatBox!.classList.add("mu-table-bar-tools");
    this.container!.appendChild(this.tableBarContainer);
    this.listen();
  }

  listen() {
    super.listen();
    const { eventCenter } = this.muya;
    eventCenter.subscribe(
      "muya-table-bar",
      ({ reference, tableInfo, block }) => {
        if (reference) {
          this.tableInfo = tableInfo;
          this.block = block;
          this.show(reference);
          this.render();
        } else {
          this.hide();
        }
      }
    );
  }

  render() {
    const { tableInfo, oldVNode, tableBarContainer } = this;
    const { i18n } = this.muya;
    const renderArray = toolList[tableInfo.barType];
    const children = renderArray.map((item) => {
      const { label } = item;

      const selector = "li.item";

      return h(
        selector,
        {
          dataset: {
            label: item.action,
          },
          on: {
            click: (event) => {
              this.selectItem(event, item);
            },
          },
        },
        i18n.t(label)
      );
    });

    const vnode = h("ul", children);

    if (oldVNode) {
      patch(oldVNode, vnode);
    } else {
      patch(tableBarContainer, vnode);
    }
    this.oldVNode = vnode;
  }

  selectItem(event, item) {
    event.preventDefault();
    event.stopPropagation();

    const { table, row } = this.block;
    const rowCount = table.firstChild.offset(row);
    const columnCount = row.offset(this.block);
    const { location, action, target } = item;

    if (action === "insert") {
      let cursorBlock = null;

      if (target === "row") {
        const offset = location === "previous" ? rowCount : rowCount + 1;
        cursorBlock = table.insertRow(offset);
      } else {
        const offset = location === "left" ? columnCount : columnCount + 1;
        cursorBlock = table.insertColumn(offset);
      }

      if (cursorBlock) {
        cursorBlock.setCursor(0, 0);
      }
    } else {
      if (target === "row") {
        table.removeRow(rowCount);
      } else {
        table.removeColumn(columnCount);
      }
    }

    this.hide();
  }
}

export default TableBarTools;
