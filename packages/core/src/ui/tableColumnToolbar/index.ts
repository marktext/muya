import type { VNode } from 'snabbdom';
import BaseFloat from '../baseFloat';
import { h, patch } from '../../utils/snabbdom';
import { isMouseEvent, throttle } from '../../utils';
import { BLOCK_DOM_PROPERTY } from '../../config';
import type { Muya } from '../../index';
import type CellBlock from '../../block/gfm/table/cell';
import type { TableColumnToolIcon } from './config';
import icons from './config';

import './index.css';

const OFFSET = 27;

const defaultOptions = {
    placement: 'top' as const,
    modifiers: {
        offset: {
            offset: '0, 0',
        },
    },
    showArrow: false,
};

export class TableColumnToolbar extends BaseFloat {
    public oldVNode: VNode | null = null;
    public block: CellBlock | null = null;
    public icons: TableColumnToolIcon[] = icons;
    public toolsContainer: HTMLDivElement = document.createElement('div');

    static pluginName = 'tableColumnTools';

    constructor(muya: Muya, options = {}) {
        const name = 'mu-table-column-tools';
        const opts = Object.assign({}, defaultOptions, options);
        super(muya, name, opts);
        this.options = opts;
        this.container!.appendChild(this.toolsContainer);
        this.floatBox!.classList.add('mu-table-column-tools-container');
        this.listen();
    }

    override listen() {
        const { eventCenter } = this.muya;
        super.listen();

        const handler = throttle((event: Event) => {
            if (!isMouseEvent(event))
                return;

            const { x, y } = event;
            const eles = [...document.elementsFromPoint(x, y)];
            const bellowEles = [...document.elementsFromPoint(x, y + OFFSET)];
            const hasTableCell = (eles: Element[]) => {
                return eles.some(
                    ele =>
                        ele[BLOCK_DOM_PROPERTY]
                        && ele[BLOCK_DOM_PROPERTY].blockName === 'table.cell',
                );
            };

            if (!hasTableCell(eles) && hasTableCell(bellowEles)) {
                // No need to show table column tools when format tool bar is shown. or the table column tools will show on the top of format toolbar.
                const { ui } = this.muya;
                for (const { name, status } of ui.shownFloat) {
                    if (name === 'mu-format-picker' && status)
                        return this.hide();
                }
                const tableCellEle = bellowEles.find(
                    ele =>
                        ele[BLOCK_DOM_PROPERTY]
                        && ele[BLOCK_DOM_PROPERTY].blockName === 'table.cell',
                );
                const cellBlock = tableCellEle![BLOCK_DOM_PROPERTY];
                this.block = cellBlock as CellBlock;
                this.show(tableCellEle!);
                this.render();
            }
            else {
                this.hide();
            }
        }, 300);

        eventCenter.attachDOMEvent(document.body, 'mousemove', handler);
    }

    render() {
        const { icons, oldVNode, toolsContainer, block } = this;
        const { i18n } = this.muya;
        const children = icons.map((i) => {
            const iconWrapperSelector = 'div.icon-wrapper';
            const icon = h(
                'i.icon',
                h(
                    'i.icon-inner',
                    {
                        style: {
                            'background': `url(${i.icon}) no-repeat`,
                            'background-size': '100%',
                        },
                    },
                    '',
                ),
            );
            const iconWrapper = h(iconWrapperSelector, icon);

            let itemSelector = `li.item.${i.type}`;
            if (block?.align === i.type)
                itemSelector += '.active';

            if (i.type === 'remove')
                itemSelector += '.delete';

            return h(
                itemSelector,
                {
                    attrs: {
                        title: `${i18n.t(i.tooltip)}`,
                    },
                    on: {
                        click: (event) => {
                            this.selectItem(event, i);
                        },
                    },
                },
                [iconWrapper],
            );
        });

        const vnode = h('ul', children);

        if (oldVNode)
            patch(oldVNode, vnode);
        else
            patch(toolsContainer, vnode);

        this.oldVNode = vnode;
    }

    selectItem(event: Event, item: TableColumnToolIcon) {
        event.preventDefault();
        event.stopPropagation();

        const { block } = this;
        // Block is not null, just in case
        if (!block || !block.parent)
            return;

        const offset = block.parent.offset(block);
        const { table, row } = block;
        const columnCount = row.offset(this.block!);

        switch (item.type) {
            case 'remove': {
                block.table.removeColumn(offset);

                return this.hide();
            }

            case 'insert left':
                // fall through
            case 'insert right': {
                const offset
          = item.type === 'insert left' ? columnCount : columnCount + 1;
                const cursorBlock = table.insertColumn(offset);
                if (cursorBlock)
                    cursorBlock.setCursor(0, 0);

                return this.hide();
            }

            default:
                block.table.alignColumn(offset, item.type);

                return this.render();
        }
    }
}
