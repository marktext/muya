import LinkedNode from "@muya/block/base/linkedList/linkedNode";
import { BLOCK_DOM_PROPERTY } from "@muya/config";
import Muya from "@muya/index";
import type { TState } from "@muya/state/types";
import { Nullable } from "@muya/types";
import { createDomNode } from "@muya/utils/dom";
import type { Attributes, Datasets } from "@muya/utils/types";
import Content from "./content";
import Parent from "./parent";

interface IConstructor<T> {
  blockName: string;
  create: (muya: Muya, state: TState) => T;
  new (muya: Muya): T;
}

class TreeNode extends LinkedNode<TreeNode> {
  public parent: Nullable<Parent> = null;
  public domNode: Nullable<HTMLElement> = null;
  public tagName: string = "";
  public classList: string[] = [];
  public attributes: Attributes = {};
  public datasets: Datasets = {};

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
   * create domNode
   */
  createDomNode() {
    const { tagName, classList, attributes, datasets } = this;

    const domNode = createDomNode(tagName, {
      classList,
      attributes,
      datasets,
    });

    domNode[BLOCK_DOM_PROPERTY] = this as unknown as Parent | Content;

    this.domNode = domNode;
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
    const results: TreeNode[] = [];
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

  insertInto(parent: Parent, refBlock: Nullable<Parent> = null) {
    if (this.parent === parent && this.next === refBlock) {
      return;
    }

    if (this.parent) {
      this.parent.removeChild(this);
    }

    parent.insertBefore(this as unknown as Parent, refBlock);
  }

  /**
   * Remove the current block in the block tree.
   */
  remove(this: Parent | Content) {
    if (!this.parent) {
      return;
    }

    this.parent.children.remove(this);
    this.parent = null;
    this.domNode?.remove();

    return this;
  }
}

export default TreeNode;
