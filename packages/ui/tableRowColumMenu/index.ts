import { h, patch } from '@muya/utils/snabbdom';
import BaseFloat from '../baseFloat';
import { MenuItem, toolList } from './config';

import TableBodyCell from '@muya/block/gfm/table/cell';
import TableInner from '@muya/block/gfm/table/table';
import Muya from '@muya/index';
import { VNode } from 'snabbdom';
import './index.css';

const defaultOptions = {
  placement: 'bottom-center',
  modifiers: {
    offset: {
      offset: '0, 5',
    },
  },
  showArrow: false,
};

type TableInfo = {
  barType: 'bottom' | 'right';
};

class TableBarTools extends BaseFloat {
  static pluginName = 'tableBarTools';
  private oldVNode: VNode | null = null;
  private tableInfo: TableInfo | null = null;
  private block: TableBodyCell | null = null;
  private tableBarContainer: HTMLDivElement = document.createElement('div');

  constructor(muya: Muya, options = {}) {
    const name = 'mu-table-bar-tools';
    const opts = Object.assign({}, defaultOptions, options);
    super(muya, name, opts);

    this.floatBox!.classList.add('mu-table-bar-tools');
    this.container!.appendChild(this.tableBarContainer);
    this.listen();
  }

  listen() {
    super.listen();
    const { eventCenter } = this.muya;
    eventCenter.subscribe(
      'muya-table-bar',
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
    const renderArray: MenuItem[] = toolList[tableInfo!.barType];
    const children = renderArray.map((item) => {
      const { label } = item;

      const selector = 'li.item';

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

    const vnode = h('ul', children);

    if (oldVNode) {
      patch(oldVNode, vnode);
    } else {
      patch(tableBarContainer, vnode);
    }
    this.oldVNode = vnode;
  }

  selectItem(event: Event, item: MenuItem) {
    event.preventDefault();
    event.stopPropagation();

    const { table, row } = this.block!;
    const rowCount = (table.firstChild as TableInner).offset(row);
    const columnCount = row.offset(this.block);
    const { location, action, target } = item;

    if (action === 'insert') {
      let cursorBlock = null;

      if (target === 'row') {
        const offset = location === 'previous' ? rowCount : rowCount + 1;
        cursorBlock = table.insertRow(offset);
      } else {
        const offset = location === 'left' ? columnCount : columnCount + 1;
        cursorBlock = table.insertColumn(offset);
      }

      if (cursorBlock) {
        cursorBlock.setCursor(0, 0);
      }
    } else {
      if (target === 'row') {
        table.removeRow(rowCount);
      } else {
        table.removeColumn(columnCount);
      }
    }

    this.hide();
  }
}

export default TableBarTools;
