// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import Table from '../index';

// Regression for marktext commit 6293d408 "fix: #572 — cursor placement
// after row/column delete". In marktext's `tableBlockCtrl`, when the user
// removed a cell that contained the caret, the code set
// `cursorBlock = getNextSibling(block)`. If the deleted cell sat on the
// edge of the table, getNextSibling returned a now-detached node and the
// caret evaporated. marktext's fix routed through `findNextBlockInLocation`,
// which walks up to the parent row and across to the next valid descendant.
//
// In new muya, `Table.removeRow` and `Table.removeColumn` previously did
// nothing more than detach DOM — they returned `void` and the caller in
// `TableRowColumMenu.selectItem` had nothing to setCursor on, so after a
// row/column delete the caret was left in an detached cell. PR-7b adds a
// cell-content return value so callers can place the caret on a surviving
// neighbour, restoring the same "click somewhere reasonable after a
// destructive table edit" contract marktext had.
//
// These tests drive `removeRow` / `removeColumn` off the prototype with a
// structurally typed `this`, the same pattern as
// `tableCell/__tests__/tabHandler.spec.ts`, so the suite stays unit-level.

interface IFakeContent {
    setCursor: (begin: number, end: number, selected?: boolean) => void;
}

interface IFakeCell {
    firstChild: IFakeContent;
    prev: Nullable<IFakeCell>;
    next: Nullable<IFakeCell>;
    remove: () => void;
}

interface IFakeRow {
    cells: IFakeCell[];
    firstChild: IFakeCell;
    prev: Nullable<IFakeRow>;
    next: Nullable<IFakeRow>;
    find: (offset: number) => Nullable<IFakeCell>;
    remove: () => void;
}

interface IFakeTableInner {
    rows: IFakeRow[];
    firstChild: IFakeRow;
    find: (offset: number) => Nullable<IFakeRow>;
    length: () => number;
    forEach: (cb: (row: IFakeRow) => void) => void;
}

type Nullable<T> = T | null | undefined;

function makeContent(): IFakeContent {
    return { setCursor: vi.fn() };
}

function makeCell(): IFakeCell {
    const cell: IFakeCell = {
        firstChild: makeContent(),
        prev: null,
        next: null,
        remove: vi.fn(() => {
            (cell as IFakeCell & { removed: boolean }).removed = true;
        }),
    } as IFakeCell;
    return cell;
}

function makeRow(cellCount: number): IFakeRow {
    const cells = Array.from({ length: cellCount }, makeCell);
    for (let i = 0; i < cells.length; i++) {
        cells[i].prev = i > 0 ? cells[i - 1] : null;
        cells[i].next = i < cells.length - 1 ? cells[i + 1] : null;
    }
    const row: IFakeRow = {
        cells,
        firstChild: cells[0],
        prev: null,
        next: null,
        find: (offset: number) => cells[offset],
        remove: vi.fn(() => {
            (row as IFakeRow & { removed: boolean }).removed = true;
        }),
    };
    return row;
}

function makeTableInner(rowCount: number, cellCount: number): IFakeTableInner {
    const rows = Array.from({ length: rowCount }, () => makeRow(cellCount));
    for (let i = 0; i < rows.length; i++) {
        rows[i].prev = i > 0 ? rows[i - 1] : null;
        rows[i].next = i < rows.length - 1 ? rows[i + 1] : null;
    }
    return {
        rows,
        firstChild: rows[0],
        find: (offset: number) => rows[offset],
        length: () => rows.length,
        forEach: (cb: (row: IFakeRow) => void) => rows.forEach(cb),
    };
}

function makeFakeTable(rowCount: number, cellCount: number) {
    const inner = makeTableInner(rowCount, cellCount);
    return {
        firstChild: inner,
        columnCount: cellCount,
        remove: vi.fn(),
        // Match the production read-only getter `rowCount`.
        get rowCountFromGetter() {
            return inner.length();
        },
        inner,
    };
}

describe('table.removeRow — returns surviving cell content for cursor placement (marktext 6293d408)', () => {
    it('removes the targeted row and returns the next row\'s first cell content', () => {
        const fake = makeFakeTable(3, 2);

        const result = Table.prototype.removeRow.call(
            fake as unknown as Table,
            1,
        );

        // Pre-fix: returned undefined, leaving caller with nothing to focus.
        // Post-fix: returns the surviving row's first cell content so the
        // caller can `setCursor(0, 0)` on it.
        expect(result).toBeTruthy();
        expect(result).toBe(fake.inner.rows[2].cells[0].firstChild);
        expect((fake.inner.rows[1] as any).removed).toBe(true);
    });

    it('falls back to the previous row\'s first cell when the last row is removed', () => {
        const fake = makeFakeTable(3, 2);

        const result = Table.prototype.removeRow.call(
            fake as unknown as Table,
            2,
        );

        expect(result).toBe(fake.inner.rows[1].cells[0].firstChild);
        expect((fake.inner.rows[2] as any).removed).toBe(true);
    });

    it('removes the whole table when the only row is removed', () => {
        const fake = makeFakeTable(1, 3);

        const result = Table.prototype.removeRow.call(
            fake as unknown as Table,
            0,
        );

        // No surviving rows → no cell content to focus → null.
        expect(result).toBeNull();
        expect(fake.remove).toHaveBeenCalledTimes(1);
    });

    it('returns undefined and does nothing when the offset is out of range', () => {
        const fake = makeFakeTable(2, 2);

        const result = Table.prototype.removeRow.call(
            fake as unknown as Table,
            99,
        );

        expect(result).toBeUndefined();
        for (const row of fake.inner.rows)
            expect((row as any).removed).not.toBe(true);
    });
});

describe('table.removeColumn — returns surviving cell content for cursor placement (marktext 6293d408)', () => {
    it('removes column at offset and returns the first row\'s neighbour cell content', () => {
        const fake = makeFakeTable(2, 3);
        // Capture the cells in column 1 (the column we're going to remove).
        const removedCol1Row0 = fake.inner.rows[0].cells[1];
        const removedCol1Row1 = fake.inner.rows[1].cells[1];
        // The surviving "next" sibling of the targeted cell in row 0 is
        // column 2 (cells[2]) — that's what the fix returns so the caller
        // can place the caret on a cell that is still attached.
        const expectedSurvivor = fake.inner.rows[0].cells[2].firstChild;

        const result = Table.prototype.removeColumn.call(
            fake as unknown as Table,
            1,
        );

        expect(result).toBe(expectedSurvivor);
        expect((removedCol1Row0 as any).removed).toBe(true);
        expect((removedCol1Row1 as any).removed).toBe(true);
    });

    it('falls back to the previous-cell content when the last column is removed', () => {
        const fake = makeFakeTable(2, 3);
        const expectedSurvivor = fake.inner.rows[0].cells[1].firstChild;

        const result = Table.prototype.removeColumn.call(
            fake as unknown as Table,
            2,
        );

        expect(result).toBe(expectedSurvivor);
    });

    it('removes the whole table when the only column is removed', () => {
        const fake = makeFakeTable(2, 1);

        Table.prototype.removeColumn.call(fake as unknown as Table, 0);

        expect(fake.remove).toHaveBeenCalledTimes(1);
    });

    it('does nothing and returns undefined when the offset is out of range', () => {
        const fake = makeFakeTable(2, 2);

        const result = Table.prototype.removeColumn.call(
            fake as unknown as Table,
            5,
        );

        expect(result).toBeUndefined();
        // No cells removed.
        for (const row of fake.inner.rows) {
            for (const cell of row.cells)
                expect((cell as any).removed).not.toBe(true);
        }
    });
});
