// @ts-nocheck
import * as json1 from "ot-json1";
import logger from "@muya/utils/logger";
import StateToMarkdown from "./stateToMarkdown";
import MarkdownToState from "./markdownToState";
import { deepCopyArray } from "@muya/utils";
import Muya from "@muya/index";

import type { JSONOpList, Doc, Path } from "ot-json1";

import { TState } from "../../types/state";

const debug = logger("jsonstate:");

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
    type: "left" | "right"
  ) {
    return json1.type.transform(op, otherOp, type);
  }

  public operationCache: Array<JSONOpList> = [];
  private isGoing: boolean = false;
  public state: Array<TState>;

  constructor(public muya: Muya, state) {
    this.setContent(state);
  }

  apply(op: JSONOpList) {
    this.state = json1.type.apply(
      this.state as unknown as Doc,
      op
    ) as unknown as Array<TState>;
  }

  setContent(content: Array<TState> | string) {
    if (typeof content === "object") {
      this.setState(content);
    } else {
      this.setMarkdown(content);
    }
  }

  setState(state: Array<TState>) {
    this.state = state;
  }

  setMarkdown(markdown: string) {
    const {
      footnote,
      isGitlabCompatibilityEnabled,
      superSubScript,
      trimUnnecessaryCodeBlockEmptyLines,
      frontMatter,
    } = this.muya.options;

    this.state = new MarkdownToState({
      footnote,
      isGitlabCompatibilityEnabled,
      superSubScript,
      trimUnnecessaryCodeBlockEmptyLines,
      frontMatter,
    }).generate(markdown);
  }

  /**
   * This method only used by user source.
   * @param method json1 operation method insertOp, removeOp, replaceOp, editOp
   * @param path 
   * @param args 
   */
  pushOperation(
    method: string,
    path: Path,
    ...args: [unknown, ...unknown[]]
  ) {
    const operation: JSONOpList = json1[method](path, ...args);
    this.operationCache.push(operation);

    if (!this.isGoing) {
      this.isGoing = true;
      requestAnimationFrame(() => {
        const op = this.operationCache.reduce(json1.type.compose);
        this.apply(op);
        // TODO: remove doc in future
        const doc = this.getState();
        this.muya.eventCenter.emit("json-change", {
          op,
          source: "user",
          doc,
        });
        this.operationCache = [];
        this.isGoing = false;
      });
    }
  }

  dispatch(op: JSONOpList, source = "user" /* user, api */) {
    this.apply(op);
    // TODO: remove doc in future
    const doc = this.getState();
    debug.log(JSON.stringify(op));
    this.muya.eventCenter.emit("json-change", {
      op,
      source,
      doc,
    });
  }

  getState(): Array<TState> {
    return deepCopyArray(this.state);
  }

  getMarkdown() {
    const state = this.getState();
    const mdGenerator = new StateToMarkdown();

    return mdGenerator.generate(state);
  }
}

export default JSONState;
