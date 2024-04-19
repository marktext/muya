import type { Doc, JSONOpList } from 'ot-json1';
import * as json1 from 'ot-json1';
import type { Muya } from '../muya';
import type { Nullable } from '../types';
import type { ISelection } from '../selection/types';
import type { TState } from '../state/types';

interface IOptions {
    delay: number;
    maxStack: number;
    userOnly: boolean;
}

interface IOperation {
    operation: JSONOpList;
    selection: Nullable<ISelection>;
}

interface IStack {
    undo: IOperation[];
    redo: IOperation[];
}

type HistoryAction = 'undo' | 'redo';

const DEFAULT_OPTIONS = {
    delay: 1000,
    maxStack: 100,
    userOnly: false,
};

class History {
    private lastRecorded: number = 0;
    private ignoreChange: boolean = false;
    private selectionStack: (Nullable<ISelection>)[] = [];
    private stack: IStack = {
        undo: [],
        redo: [],
    };

    get selection() {
        return this.muya.editor.selection;
    }

    constructor(public muya: Muya, private options: IOptions = DEFAULT_OPTIONS) {
        this.listen();
    }

    listen() {
        this.muya.eventCenter.on(
            'json-change',
            ({
                op,
                source,
                doc,
            }: {
                op: JSONOpList;
                source: string;
                doc: TState[];
            }) => {
                if (this.ignoreChange)
                    return;

                if (!this.options.userOnly || source === 'user')
                    this.record(op, doc);
                else
                    this.transform(op);
            },
        );
    }

    change(source: HistoryAction, dest: HistoryAction) {
        if (this.stack[source].length === 0)
            return;

        const { operation, selection } = this.stack[source].pop()!;
        const inverseOperation = json1.type.invert(operation);

        this.stack[dest].push({
            operation: inverseOperation as JSONOpList,
            selection: this.selection.getSelection(),
        });

        this.lastRecorded = 0;
        this.ignoreChange = true;
        this.muya.editor.updateContents(operation, selection, 'user');
        this.ignoreChange = false;

        this.getLastSelection();
    }

    clear() {
        this.stack = { undo: [], redo: [] };
    }

    cutoff() {
        this.lastRecorded = 0;
    }

    getLastSelection() {
        this.selectionStack.push(this.selection.getSelection());

        if (this.selectionStack.length > 2)
            this.selectionStack.shift();

        return this.selectionStack.length === 2 ? this.selectionStack[0] : null;
    }

    record(op: JSONOpList, doc: TState[]) {
        if (op.length === 0)
            return;

        let selection = this.getLastSelection();
        this.stack.redo = [];
        let undoOperation = json1.type.invert(op);
        const timestamp = Date.now();
        if (
            this.lastRecorded + this.options.delay > timestamp
            && this.stack.undo.length > 0
        ) {
            const { operation: lastOperation, selection: lastSelection }
        = this.stack.undo.pop()!;
            selection = lastSelection;
            undoOperation = json1.type.makeInvertible(
                json1.type.compose(undoOperation, lastOperation),
                doc as unknown as Doc,
            );
        }
        else {
            this.lastRecorded = timestamp;
        }

        if (!undoOperation || undoOperation.length === 0)
            return;

        this.stack.undo.push({ operation: undoOperation, selection });

        if (this.stack.undo.length > this.options.maxStack)
            this.stack.undo.shift();
    }

    canRedo() {
        return this.stack.redo.length > 0;
    }

    redo() {
        this.change('redo', 'undo');
    }

    transform(op: JSONOpList) {
        transformStack(this.stack.undo, op);
        transformStack(this.stack.redo, op);
    }

    canUndo() {
        return this.stack.undo.length > 0;
    }

    undo() {
        this.change('undo', 'redo');
    }
}

function transformStack(stack: IOperation[], operation: JSONOpList) {
    let remoteOperation = operation;

    for (let i = stack.length - 1; i >= 0; i -= 1) {
        const { operation: oldOperation } = stack[i];
        // TODO: need test.
        stack[i] = Object.assign(stack[i], {
            operation: json1.type.transform(oldOperation, remoteOperation, 'left'),
        });
        remoteOperation = json1.type.transform(
            remoteOperation,
            oldOperation,
            'right',
        )!;
        if (stack[i].operation.length === 0)
            stack.splice(i, 1);
    }
}

export default History;
