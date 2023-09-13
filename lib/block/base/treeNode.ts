import LinkedNode from "@muya/block/base/linkedList/linkedNode";
import { createDomNode } from "@muya/utils/dom";
import { BLOCK_DOM_PROPERTY } from "@muya/config";
import Muya from "@muya/index";
import Parent from "./parent";
import Content from "./content";
import type { IAttributes, IDatasets } from "../../../types/dom";
import type { TState } from "../../../types/state";

interface IConstructor<T> {
  blockName: string;
  create: (muya: Muya, state: Array<TState>) => T;
  new (muya: Muya): T;
}

abstract class TreeNode extends LinkedNode {
  public parent: Parent | null = null;
  public domNode: HTMLElement | null = null;
  public tagName: string = "";
  public classList: Array<string> = [];
  public attributes: IAttributes = {};
  public datasets: IDatasets = {};

  abstract get path(): Array<number | string>;
  abstract get isContainerBlock(): boolean;

  static blockName = "tree.node";

  get static(): IConstructor<TreeNode> {
    return this.constructor as unknown as IConstructor<TreeNode>;
  }

  get blockName() {
    return this.static.blockName;
  }

  get jsonState() {
    return this.muya.editor.jsonState;
  }

  get scrollPage() {
    return this.muya.editor.scrollPage;
  }

  get isScrollPage() {
    return this.blockName === "scrollpage";
  }

  get isOutMostBlock(): boolean {
    return this.parent ? this.parent.isScrollPage : false;
  }

  get outMostBlock(): this | Parent | null {
    let node = this.isContent() ? this.parent : this;

    while (node) {
      if (node.isOutMostBlock) {
        return node;
      }
      node = node.parent;
    }

    return null;
  }

  constructor(public muya: Muya) {
    super();
  }

  /**
   * check this is a Content block?
   * @param this
   * @returns boolean
   */
  isContent(this: any): this is Content {
    return typeof this.text === "string";
  }

  /**
   * check this is a Parent block?
   * @param this
   * @returns boolean
   */
  isParent(this: unknown): this is Parent {
    return this instanceof Parent;
  }

  /**
   * create domNode
   */
  createDomNode() {
    const { tagName, classList, attributes, datasets } = this;

    const domNode = createDomNode(tagName, {
      classList,
      attributes,
      datasets,
    });

    domNode[BLOCK_DOM_PROPERTY] = this;

    this.domNode = domNode;

    return domNode;
  }

  // Get previous content block in block tree.
  previousContentInContext(): Content | null {
    if (this.isScrollPage || !this.parent) {
      return null;
    }

    const { parent } = this;
    if (parent.prev) {
      return parent.prev.isParent()
        ? parent.prev.lastContentInDescendant()
        : parent.prev; // language input
    } else {
      return parent.previousContentInContext();
    }
  }

  // Get next content block in block tree.
  nextContentInContext(): Content | null {
    if (this.isScrollPage || !this.parent) {
      return null;
    }

    const { parent } = this;

    if (this.blockName === "language-input") {
      return parent.lastContentInDescendant();
    }

    if (parent.next) {
      return parent.next.firstContentInDescendant();
    } else {
      return parent.nextContentInContext();
    }
  }

  /**
   * Weather `this` is the only child of its parent.
   */
  isOnlyChild() {
    return this.isFirstChild() && this.isLastChild();
  }

  /**
   * Weather `this` is the first child of its parent.
   */
  isFirstChild() {
    return this.prev === null;
  }

  /**
   * Weather `this` is the last child of its parent.
   */
  isLastChild() {
    return this.next === null;
  }

  /**
   * Weather `this` is descendant of `block`
   * @param {*} block
   */
  isInBlock(block: Parent) {
    let parent = this.parent;
    while (parent) {
      if (parent === block) {
        return true;
      }
      parent = parent.parent;
    }

    return false;
  }

  /**
   * Find the closest block which blockName is `blockName`. return `null` if not found.
   * @param {string} blockName
   */
  closestBlock(blockName: string): TreeNode | null {
    if (this.blockName === blockName) {
      return this;
    }
    let parent = this.parent;

    while (parent) {
      if (parent.blockName === blockName) {
        return parent;
      }

      parent = parent.parent;
    }

    return null;
  }

  farthestBlock(blockName: string): TreeNode | null {
    const results: Array<TreeNode> = [];
    if (this.blockName === blockName) {
      results.push(this);
    }

    let parent = this.parent;

    while (parent) {
      if (parent.blockName === blockName) {
        results.push(parent);
      }

      parent = parent.parent;
    }
    const popItem = results.pop();

    return popItem ? popItem : null;
  }

  insertInto(parent: Parent, refBlock: TreeNode) {
    if (this.parent === parent && this.next === refBlock) {
      return;
    }

    if (this.parent) {
      this.parent.removeChild(this);
    }

    parent.insertBefore(this, refBlock);
  }

  /**
   * Remove the current block in the block tree.
   */
  remove(): this {
    if (!this.parent) {
      return this;
    }
    this.parent.children.remove(this);
    this.parent = null;
    this.domNode?.remove();

    return this;
  }
}

export default TreeNode;
