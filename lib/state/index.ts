import Muya from '@muya/index';
import { TDiff, deepClone } from '@muya/utils';
import logger from '@muya/utils/logger';
import * as json1 from 'ot-json1';
import MarkdownToState from './markdownToState';
import StateToMarkdown from './stateToMarkdown';

import type { Doc, JSONOpList, Path } from 'ot-json1';
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
    type: 'left' | 'right'
  ) {
    return json1.type.transform(op, otherOp, type);
  }

  public operationCache: JSONOpList[] = [];
  private isGoing: boolean = false;
  private state: TState[] = [];

  constructor(public muya: Muya, stateOrMarkdown: TState[] | string) {
    this.setContent(stateOrMarkdown);
  }

  apply(op: JSONOpList) {
    this.state = json1.type.apply(
      this.state as unknown as Doc,
      op
    ) as unknown as TState[];
  }

  setContent(content: TState[] | string) {
    if (typeof content === 'object') {
      this.setState(content);
    } else {
      this.setMarkdown(content);
    }
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

    this.operationCache.push(operation);

    this._emitStateChange();
  }

  removeOperation(path: Path) {
    const operation = json1.removeOp(path)!;

    this.operationCache.push(operation);

    this._emitStateChange();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editOperation(path: Path, diff: TDiff[]) {
    const operation = json1.editOp(path, 'text-unicode', diff)!;

    this.operationCache.push(operation);

    this._emitStateChange();
  }

  replaceOperation(path: Path, oldValue: TState, newValue: TState) {
    const operation = json1.replaceOp(path, oldValue as unknown as Doc, newValue as unknown as Doc)!;

    this.operationCache.push(operation);

    this._emitStateChange();
  }

  private _emitStateChange() {
    if (!this.isGoing) {
      this.isGoing = true;
      requestAnimationFrame(() => {
        const op = this.operationCache.reduce(json1.type.compose);
        this.apply(op);
        // TODO: remove doc in future
        const doc = this.getState();
        this.muya.eventCenter.emit('json-change', {
          op,
          source: 'user',
          doc,
        });
        this.operationCache = [];
        this.isGoing = false;
      });
    }
  }

  dispatch(op: JSONOpList, source = 'user' /* user, api */) {
    this.apply(op);
    // TODO: remove doc in future
    const doc = this.getState();
    debug.log(JSON.stringify(op));
    this.muya.eventCenter.emit('json-change', {
      op,
      source,
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
}

export default JSONState;
