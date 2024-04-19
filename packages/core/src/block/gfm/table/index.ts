import diff from 'fast-diff';
import LinkedList from '../../base/linkedList/linkedList';
import Parent from '../../base/parent';
import type TableCellContent from '../../content/tableCell';
import ScrollPage from '../../scrollPage';
import type { TBlockPath } from '../../types';
import type { Muya } from '../../../muya';
import type { Nullable } from '../../../types';
import { diffToTextOp } from '../../../utils';
import logger from '../../../utils/logger';
import type { ITableState } from '../../../state/types';
import type TableBodyCell from './cell';
import type TableRow from './row';
import type TableInner from './table';

const debug = logger('table:');

class Table extends Parent {
    override children: LinkedList<TableInner> = new LinkedList();

    static override blockName = 'table';

    static create(muya: Muya, state: ITableState) {
        const table = new Table(muya);

        table.append(ScrollPage.loadBlock('table.inner').create(muya, state));

        return table;
    }

    // static createWithRowAndColumn(muya, row, column) {
    //   // TODO
    // }

    static createWithHeader(muya: Muya, header: string[]) {
        const state: ITableState = {
            name: 'table',
            children: [
                {
                    name: 'table.row',
                    children: header.map(c => ({
                        name: 'table.cell',
                        meta: { align: 'none' },
                        text: c,
                    })),
                },
                {
                    name: 'table.row',
                    children: header.map(() => ({
                        name: 'table.cell',
                        meta: { align: 'none' },
                        text: '',
                    })),
                },
            ],
        };

        return this.create(muya, state);
    }

    override get path() {
        const { path: pPath } = this.parent!;
        const offset = this.parent!.offset(this);

        return [...pPath, offset];
    }

    get rowCount() {
        return (this.firstChild as TableInner).length();
    }

    get columnCount() {
        return ((this.firstChild as TableInner).firstChild as TableRow).length();
    }

    constructor(muya: Muya) {
        super(muya);
        this.tagName = 'figure';

        this.classList = ['mu-table'];
        this.createDomNode();
        this._listenDomEvent();
    }

    isEmpty() {
        const state = this.getState();

        return state.children.every(row =>
            row.children.every(cell => cell.text === ''),
        );
    }

    private _listenDomEvent() {
        const { eventCenter } = this.muya;
        const { domNode } = this;

        // Fix: prevent cursor present at the end of table.
        const clickHandler = (event: Event) => {
            if (event.target === domNode) {
                event.preventDefault();
                const cursorBlock = this.lastContentInDescendant()!;
                const offset = cursorBlock.text.length;
                cursorBlock.setCursor(offset, offset, true);
            }
        };
        eventCenter.attachDOMEvent(domNode!, 'mousedown', clickHandler);
    }

    queryBlock(path: TBlockPath) {
        return (this.firstChild as any).queryBlock(path);
    }

    override empty() {
        if (this.isEmpty())
            return;

        const table = this.children.head;
        if (table == null)
            return;

        table.forEach((row) => {
            (row as TableRow).forEach((cell) => {
                ((cell as TableBodyCell).firstChild as TableCellContent).text = '';
            });
        });
    }

    insertRow(offset: number) {
        const { columnCount } = this;
        const firstRowState = this.getState().children[0];
        const currentRow
      = offset > 0
          ? (this.firstChild as TableInner).find(offset - 1)
          : (this.firstChild as TableInner).find(offset);
        const state = {
            name: 'table.row',
            // eslint-disable-next-line unicorn/no-new-array
            children: [...new Array(columnCount)].map((_, i) => {
                return {
                    name: 'table.cell',
                    meta: {
                        align: firstRowState.children[i].meta.align,
                    },
                    text: '',
                };
            }),
        };

        const rowBlock = ScrollPage.loadBlock('table.row').create(this.muya, state);

        if (offset > 0)
            (this.firstChild as TableInner).insertAfter(rowBlock, currentRow as TableRow);
        else
            (this.firstChild as TableInner).insertBefore(rowBlock, currentRow as TableRow);

        return rowBlock.firstContentInDescendant();
    }

    insertColumn(offset: number, align = 'none') {
        const tableInner = this.firstChild as TableInner;
        let firstCellInNewColumn: Nullable<TableBodyCell> = null;

        tableInner.forEach((row) => {
            const state = {
                name: 'table.cell',
                meta: { align },
                text: '',
            };
            const cell = ScrollPage.loadBlock('table.cell').create(this.muya, state);
            const ref = (row as TableRow).find(offset);

            (row as TableRow).insertBefore(cell, ref as TableBodyCell);
            if (!firstCellInNewColumn)
                firstCellInNewColumn = cell;
        });

        return firstCellInNewColumn!.firstChild as TableCellContent;
    }

    removeRow(offset: number) {
        const row = (this.firstChild as TableInner).find(offset);
        if (row == null)
            return;

        row.remove();
    }

    removeColumn(offset: number) {
        const { columnCount } = this;
        if (offset < 0 || offset >= columnCount) {
            debug.warn(`column at ${offset} is not existed.`);
            return;
        }

        const table = this.firstChild as TableInner;
        if (this.columnCount === 1)
            return this.remove();

        table.forEach((row) => {
            const cell = (row as TableRow).find(offset);
            if (cell)
                cell.remove();
        });
    }

    alignColumn(offset: number, value: string) {
        const { columnCount } = this;
        if (offset < 0 || offset >= columnCount) {
            debug.warn(`Column at ${offset} is not existed.`);
            return;
        }

        const table = this.firstChild as TableInner;
        table.forEach((row) => {
            const cell = (row as TableRow).find(offset) as TableBodyCell;
            if (cell) {
                const { align: oldValue } = cell;
                cell.align = oldValue === value ? 'none' : value;
                // dispatch change to modify json state
                const diffs = diff(oldValue, cell.align);
                const { path } = cell;
                path.push('meta', 'align');

                this.jsonState.editOperation(path, diffToTextOp(diffs));
            }
        });
    }

    override getState(): ITableState {
        return (this.firstChild as TableInner).getState();
    }
}

export default Table;
