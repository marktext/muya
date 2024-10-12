import * as json1 from 'ot-json1';
import type { Doc, JSONOpList, Path } from 'ot-json1';
import type { Muya } from '../muya';
import type { TDiff } from '../utils';
import { deepClone } from '../utils';
import logger from '../utils/logger';
import { MarkdownToState } from './markdownToState';
import StateToMarkdown from './stateToMarkdown';

import type { TState } from './types';

const debug = logger('jsonState:');

class JSONState {
    static invert(op: JSONOpList) {
        return json1.type.invert(op);
    }

    static compose(op1: JSONOpList, op2: JSONOpList) {
        return json1.type.compose(op1, op2);
    }

    static transform(
        op: JSONOpList,
        otherOp: JSONOpList,
        type: 'left' | 'right',
    ) {
        return json1.type.transform(op, otherOp, type);
    }

    private _operationCache: JSONOpList[] = [];

    private _isGoing = false;

    private state: TState[] = [];

    constructor(public muya: Muya, stateOrMarkdown: TState[] | string) {
        this.setContent(stateOrMarkdown);
    }

    apply(op: JSONOpList) {
        this.state = json1.type.apply(
            this.state as unknown as Doc,
            op,
        ) as unknown as TState[];
    }

    setContent(content: TState[] | string) {
        if (typeof content === 'object')
            this.setState(content);
        else
            this.setMarkdown(content);
    }

    setState(state: TState[]) {
        this.state = state;
    }

    setMarkdown(markdown: string) {
        const {
            footnote,
            isGitlabCompatibilityEnabled,
            trimUnnecessaryCodeBlockEmptyLines,
            frontMatter,
            math,
        } = this.muya.options;

        this.state = new MarkdownToState({
            footnote,
            isGitlabCompatibilityEnabled,
            trimUnnecessaryCodeBlockEmptyLines,
            frontMatter,
            math,
        }).generate(markdown);
    }

    insertOperation(path: Path, state: TState) {
        const operation = json1.insertOp(path, state as unknown as Doc)!;

        this._operationCache.push(operation);

        this._emitStateChange();
    }

    removeOperation(path: Path) {
        const operation = json1.removeOp(path)!;

        this._operationCache.push(operation);

        this._emitStateChange();
    }

    editOperation(path: Path, diff: TDiff[]) {
        const operation = json1.editOp(path, 'text-unicode', diff)!;

        this._operationCache.push(operation);

        this._emitStateChange();
    }

    replaceOperation(path: Path, oldValue: Doc, newValue: Doc) {
        const operation = json1.replaceOp(path, oldValue, newValue)!;

        this._operationCache.push(operation);

        this._emitStateChange();
    }

    dispatch(op: JSONOpList, source = 'user' /* user, api */) {
        const prevDoc = this.getState();
        this.apply(op);
        // TODO: remove doc in future
        const doc = this.getState();
        debug.log(JSON.stringify(op));
        this.muya.eventCenter.emit('json-change', {
            op,
            source,
            prevDoc,
            doc,
        });
    }

    getState(): TState[] {
        return deepClone(this.state);
    }

    getMarkdown() {
        const state = this.getState();
        const mdGenerator = new StateToMarkdown();

        return mdGenerator.generate(state);
    }

    private _emitStateChange() {
        if (this._isGoing)
            return;

        this._isGoing = true;

        requestAnimationFrame(() => {
            const op = this._operationCache.reduce(json1.type.compose as any);
            const prevDoc = this.getState();
            this.apply(op);
            // TODO: remove doc in future
            const doc = this.getState();
            this.muya.eventCenter.emit('json-change', {
                op,
                source: 'user',
                prevDoc,
                doc,
            });
            this._operationCache = [];
            this._isGoing = false;
        });
    }
}

export default JSONState;
