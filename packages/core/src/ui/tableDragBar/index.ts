import { ScrollPage } from '../../block/scrollPage';
import { BLOCK_DOM_PROPERTY } from '../../config';
import { isMouseEvent, throttle } from '../../utils';
import BaseFloat from '../baseFloat';

import type Table from '../../block/gfm/table';
import type TableBodyCell from '../../block/gfm/table/cell';
import type TableInner from '../../block/gfm/table/table';
import type { Muya } from '../../index';
import './index.css';

type BarType = 'bottom' | 'right';

interface IDragInfo {
    table: Table;
    clientX: number;
    clientY: number;
    barType: BarType;
    index: number;
    curIndex: number;
    dragCells: HTMLTableCellElement[];
    cells: HTMLTableCellElement[][];
    aspects: number[];
    offset: number;
}

function calculateAspects(tableBlock: Table, barType: BarType) {
    const table = tableBlock.firstChild!.domNode!;

    if (barType === 'bottom') {
        const firstRow = table.querySelector('tr');

        return Array.from(firstRow!.children).map(cell => cell.clientWidth);
    }
    else {
        return Array.from(table.querySelectorAll('tr')).map(
            row => row.clientHeight,
        );
    }
}

export function getAllTableCells(tableBlock: Table) {
    const table = tableBlock.firstChild!.domNode!;
    const rows = table.querySelectorAll('tr');
    const cells = [];

    for (const row of Array.from(rows))
        cells.push(Array.from(row.children));

    return cells as HTMLTableCellElement[][];
}

export function getIndex(barType: BarType, cellBlock: TableBodyCell) {
    const { row, table } = cellBlock;

    return barType === 'bottom'
        ? row.offset(cellBlock)
        : (table.firstChild as TableInner).offset(row);
}

function getDragCells(tableBlock: Table, barType: BarType, index: number) {
    const table = tableBlock.firstChild!.domNode!;
    const dragCells = [];

    if (barType === 'right') {
        const row = [...table.querySelectorAll('tr')][index];
        dragCells.push(...row.children);
    }
    else {
        const rows = [...table.querySelectorAll('tr')];
        const len = rows.length;
        let i;

        for (i = 0; i < len; i++)
            dragCells.push(rows[i].children[index]);
    }

    return dragCells as HTMLTableCellElement[];
}

const OFFSET = 20;

const rightOptions = {
    placement: 'right' as const,
    modifiers: {
        offset: {
            offset: '0, 0',
        },
    },
    showArrow: false,
};

const bottomOptions = {
    placement: 'bottom' as const,
    modifiers: {
        offset: {
            offset: '0, 0',
        },
    },
    showArrow: false,
};

export class TableDragBar extends BaseFloat {
    static pluginName = 'tableDragBar';
    private block: TableBodyCell | null = null;
    private mouseTimer: ReturnType<typeof setTimeout> | null = null;
    private dragEventIds: string[] = [];
    private isDragTableBar: boolean = false;
    private barType: 'bottom' | 'right' | null = null;
    private dragInfo: IDragInfo | null = null;

    constructor(muya: Muya, options = {}) {
        const name = 'mu-table-drag-bar';
        const opts = Object.assign({}, bottomOptions, options);
        super(muya, name, opts);

        this.floatBox!.classList.add('mu-table-drag-container');
        this.listen();
    }

    override listen() {
        const { eventCenter } = this.muya;
        const { container } = this;
        super.listen();

        const handler = throttle((event: Event) => {
            if (!isMouseEvent(event))
                return;

            const { x, y } = event;
            const els = [...document.elementsFromPoint(x, y)];
            const aboveEls = [...document.elementsFromPoint(x, y - OFFSET)];
            const leftEls = [...document.elementsFromPoint(x - OFFSET, y)];

            const hasTableCell = (els: Element[]) =>
                els.some(
                    ele =>
                        ele[BLOCK_DOM_PROPERTY]
                        && ele[BLOCK_DOM_PROPERTY].blockName === 'table.cell',
                );

            if (
                !this.isDragTableBar
                && !hasTableCell(els)
                && (hasTableCell(aboveEls) || hasTableCell(leftEls))
            ) {
                const tableCellEl = [...aboveEls, ...leftEls].find(
                    ele =>
                        ele[BLOCK_DOM_PROPERTY]
                        && ele[BLOCK_DOM_PROPERTY].blockName === 'table.cell',
                );
                const cellBlock = tableCellEl![BLOCK_DOM_PROPERTY] as TableBodyCell;
                const barType = hasTableCell(aboveEls) ? 'bottom' : 'right';

                this.options = Object.assign(
                    {},
                    barType === 'right' ? rightOptions : bottomOptions,
                );
                this.barType = barType;
                this.block = cellBlock;
                this.show(tableCellEl!);
                this.render(barType);
            }
            else {
                this.hide();
            }
        });

        eventCenter.attachDOMEvent(document.body, 'mousemove', handler);
        eventCenter.attachDOMEvent(container!, 'mousedown', this.mousedown);
        eventCenter.attachDOMEvent(container!, 'mouseup', this.mouseup);
    }

    mousedown = (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
        this.mouseTimer = setTimeout(() => {
            this.startDrag(event);
            this.mouseTimer = null;
        }, 300);
    };

    mouseup = (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
        const { container, barType } = this;
        const { eventCenter } = this.muya;

        if (this.mouseTimer) {
            clearTimeout(this.mouseTimer);
            this.mouseTimer = null;
            if (barType === 'right') {
                eventCenter.emit('muya-table-bar', {
                    reference: container,
                    tableInfo: {
                        barType,
                    },
                    block: this.block,
                });
            }
        }
    };

    startDrag(event: Event) {
        event.preventDefault();
        if (!isMouseEvent(event) || !this.block || !this.barType)
            return;

        const { table } = this.block;
        const { eventCenter } = this.muya;
        const { clientX, clientY } = event;
        const barType = this.barType;
        const index = getIndex(barType, this.block);
        const aspects = calculateAspects(table, barType);
        this.dragInfo = {
            table,
            clientX,
            clientY,
            barType,
            index,
            curIndex: index,
            dragCells: getDragCells(table, barType, index),
            cells: getAllTableCells(table),
            aspects,
            offset: 0,
        };

        for (const row of this.dragInfo.cells) {
            for (const cell of row) {
                if (!this.dragInfo.dragCells.includes(cell))
                    cell.classList.add('mu-cell-transform');
            }
        }

        this.dragEventIds.push(
            eventCenter.attachDOMEvent(document, 'mousemove', this.docMousemove),
            eventCenter.attachDOMEvent(document, 'mouseup', this.docMouseup),
        );
    }

    docMousemove = (event: Event) => {
        if (!this.dragInfo || !isMouseEvent(event))
            return;

        const { barType } = this.dragInfo;
        const attrName = barType === 'bottom' ? 'clientX' : 'clientY';
        const offset = (this.dragInfo.offset
      = event[attrName] - this.dragInfo[attrName]);
        if (Math.abs(offset) < 5)
            return;

        this.isDragTableBar = true;
        this.calculateCurIndex();
        this.setDragTargetStyle();
        this.setSwitchStyle();
    };

    docMouseup = (event: Event) => {
        event.preventDefault();

        const { eventCenter } = this.muya;

        for (const id of this.dragEventIds)
            eventCenter.detachDOMEvent(id);

        this.dragEventIds = [];
        if (!this.isDragTableBar)
            return;

        this.setDropTargetStyle();

        // The drop animation need 300ms.
        setTimeout(() => {
            this.switchTableData();
            this.resetDragTableBar();
        }, 300);
    };

    calculateCurIndex = () => {
        if (!this.dragInfo)
            return;

        const { aspects, index } = this.dragInfo;
        let { offset } = this.dragInfo;
        let curIndex = index;
        const len = aspects.length;
        let i;
        if (offset > 0) {
            for (i = index; i < len; i++) {
                const aspect = aspects[i];
                if (i === index)
                    offset -= Math.floor(aspect / 2);
                else
                    offset -= aspect;

                if (offset < 0)
                    break;
                else
                    curIndex++;
            }
        }
        else if (offset < 0) {
            for (i = index; i >= 0; i--) {
                const aspect = aspects[i];
                if (i === index)
                    offset += Math.floor(aspect / 2);
                else
                    offset += aspect;

                if (offset > 0)
                    break;
                else
                    curIndex--;
            }
        }

        this.dragInfo.curIndex = Math.max(0, Math.min(curIndex, len - 1));
    };

    setDragTargetStyle = () => {
        const { offset, barType, dragCells } = this.dragInfo!;

        for (const cell of dragCells) {
            if (!cell.classList.contains('mu-drag-cell')) {
                cell.classList.add('mu-drag-cell');
                cell.classList.add(`mu-drag-${barType}`);
            }
            const valueName = barType === 'bottom' ? 'translateX' : 'translateY';
            cell.style.transform = `${valueName}(${offset}px)`;
        }
    };

    setSwitchStyle = () => {
        if (!this.dragInfo)
            return;

        const { index, offset, curIndex, barType, aspects, cells } = this.dragInfo;
        const aspect = aspects[index];
        const len = aspects.length;

        let i;
        if (offset > 0) {
            if (barType === 'bottom') {
                for (const row of cells) {
                    for (i = 0; i < len; i++) {
                        const cell = row[i];
                        if (i > index && i <= curIndex)
                            cell.style.transform = `translateX(${-aspect}px)`;
                        else if (i !== index)
                            cell.style.transform = 'translateX(0px)';
                    }
                }
            }
            else {
                for (i = 0; i < len; i++) {
                    const row = cells[i];

                    for (const cell of row) {
                        if (i > index && i <= curIndex)
                            cell.style.transform = `translateY(${-aspect}px)`;
                        else if (i !== index)
                            cell.style.transform = 'translateY(0px)';
                    }
                }
            }
        }
        else {
            if (barType === 'bottom') {
                for (const row of cells) {
                    for (i = 0; i < len; i++) {
                        const cell = row[i];
                        if (i >= curIndex && i < index)
                            cell.style.transform = `translateX(${aspect}px)`;
                        else if (i !== index)
                            cell.style.transform = 'translateX(0px)';
                    }
                }
            }
            else {
                for (i = 0; i < len; i++) {
                    const row = cells[i];

                    for (const cell of row) {
                        if (i >= curIndex && i < index)
                            cell.style.transform = `translateY(${aspect}px)`;
                        else if (i !== index)
                            cell.style.transform = 'translateY(0px)';
                    }
                }
            }
        }
    };

    setDropTargetStyle = () => {
        if (!this.dragInfo)
            return;

        const { dragCells, barType, curIndex, index, aspects, offset }
      = this.dragInfo;
        let move = 0;
        let i;
        if (offset > 0) {
            for (i = index + 1; i <= curIndex; i++)
                move += aspects[i];
        }
        else {
            for (i = curIndex; i < index; i++)
                move -= aspects[i];
        }

        for (const cell of dragCells) {
            cell.classList.remove('mu-drag-cell');
            cell.classList.remove(`mu-drag-${barType}`);
            cell.classList.add('mu-cell-transform');
            const valueName = barType === 'bottom' ? 'translateX' : 'translateY';
            cell.style.transform = `${valueName}(${move}px)`;
        }
    };

    switchTableData = () => {
        if (!this.dragInfo)
            return;

        const { barType, index, curIndex, table, offset } = this.dragInfo;
        if (index === curIndex)
            return;

        const tableState = table.getState();

        let cursorRowOffset = null;
        let cursorColumnOffset = null;
        let startOffset = 0;
        let endOffset = 0;

        // Find the new cursor position in table.
        if (table.active) {
            // TODO: @JOCS remove use this.selection directly
            const { anchorBlock, anchor, focus, isSelectionInSameBlock }
        = this.muya.editor.selection ?? {};
            const { rowOffset, columnOffset } = anchorBlock?.closestBlock(
                'table.cell',
            ) as TableBodyCell;

            startOffset = isSelectionInSameBlock
                ? Math.min(anchor!.offset, focus!.offset)
                : 0;
            endOffset = isSelectionInSameBlock
                ? Math.max(anchor!.offset, focus!.offset)
                : 0;
            if (barType === 'bottom') {
                cursorRowOffset = rowOffset;
                if (columnOffset === index)
                    cursorColumnOffset = curIndex;
                else if (
                    columnOffset >= Math.min(index, curIndex)
                    && columnOffset <= Math.max(index, curIndex)
                )
                    cursorColumnOffset = columnOffset + (offset > 0 ? -1 : 1);
                else
                    cursorColumnOffset = columnOffset;
            }
            else {
                cursorColumnOffset = columnOffset;
                if (rowOffset === index)
                    cursorRowOffset = curIndex;
                else if (
                    rowOffset >= Math.min(index, curIndex)
                    && rowOffset <= Math.max(index, curIndex)
                )
                    cursorRowOffset = rowOffset + (offset > 0 ? -1 : 1);
                else
                    cursorRowOffset = rowOffset;
            }
        }

        if (barType === 'bottom') {
            tableState.children.forEach((row) => {
                const cellState = row.children.splice(index, 1)[0];
                row.children.splice(curIndex, 0, cellState);
            });
        }
        else {
            const rowState = tableState.children.splice(index, 1)[0];
            tableState.children.splice(curIndex, 0, rowState);
        }

        const newTable = ScrollPage.loadBlock('table').create(
            this.muya,
            tableState,
        );
        table.replaceWith(newTable);

        if (cursorRowOffset !== null && cursorColumnOffset !== null) {
            const cursorBlock = newTable.firstChild
                .find(cursorRowOffset)
                .find(cursorColumnOffset)
                .firstContentInDescendant();
            cursorBlock.setCursor(startOffset, endOffset, true);
        }
    };

    resetDragTableBar = () => {
        this.dragInfo = null;
        this.isDragTableBar = false;
    };

    render(barType: BarType) {
        this.container!.dataset.drag = barType;
    }
}
