import LinkedNode from "@muya/block/base/linkedList/linkedNode";
import LinkedList from "@muya/block/base/linkedList/linkedList";
import { createDomNode } from "@muya/utils/dom";
import { BLOCK_DOM_PROPERTY } from "@muya/config";
import Muya from "@muya/index";

interface IAttributes {
  [propName: string]: string | boolean;
}

interface IDatasets {
  [propName: string]: string | boolean;
}

interface IConstructor<T> {
  blockName: string;
  create: (muya: Muya, state: any) => T;
  new (muya: Muya): T;
}

class TreeNode extends LinkedNode {
  static blockName = 'tree.node';

  public muya: Muya;
  public parent: TreeNode | null;
  public domNode: HTMLElement;
  public tagName: string;
  public classList: Array<string>;
  public attributes: IAttributes;
  public datasets: IDatasets;
  public children: LinkedList<TreeNode> | undefined;
  public prev: TreeNode | null;
  public next: TreeNode | null;


  get static(): IConstructor<TreeNode> {
    return this.constructor as any as IConstructor<TreeNode>;
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

  get isOutMostBlock() {
    return this.parent.isScrollPage;
  }

  get outMostBlock() {
    let node: TreeNode | null = this;

    while (node) {
      if (node.isOutMostBlock) {
        return node;
      }
      node = node.parent;
    }

    return null;
  }

  /**
   * Judge weather block is content block. paragraph content, atx heading content, setext heading content etc.
   */
  get isContentBlock() {
    return typeof (this as any).text === "string";
  }

  get isLeafBlock() {
    return this.children instanceof LinkedList;
  }

  get isContainerBlock() {
    return /block-quote|order-list|bullet-list|task-list|list-item|task-list-item/.test(
      this.blockName
    );
  }

  constructor(muya) {
    super();
    this.muya = muya;
    this.parent = null;
    this.domNode = null;
    this.tagName = null;
    this.classList = [];
    this.attributes = {};
    this.datasets = {};
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
  previousContentInContext() {
    if (this.isScrollPage) {
      return null;
    }

    const { parent } = this;
    if (parent.prev) {
      return parent.prev.isLeafBlock
        ? (parent.prev as any).lastContentInDescendant()
        : parent.prev; // language input
    } else {
      return parent.previousContentInContext();
    }
  }

  // Get next content block in block tree.
  nextContentInContext() {
    if (this.isScrollPage) {
      return null;
    }

    const { parent } = this;

    if (this.blockName === "language-input") {
      return (parent as any).lastContentInDescendant();
    }

    if (parent.next) {
      return (parent.next as any).firstContentInDescendant();
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
  isInBlock(block) {
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
  closestBlock(blockName) {
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

  farthestBlock(blockName) {
    const results = [];
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

    return results.pop();
  }

  insertInto(parent, refBlock) {
    if (this.parent === parent && this.next === refBlock) {
      return;
    }

    if (this.parent) {
      (this.parent as any).removeChild(this);
    }

    parent.insertBefore(this, refBlock);
  }

  /**
   * Remove the current block in the block tree.
   */
  remove() {
    if (!this.parent) return;
    this.parent.children.remove(this);
    this.parent = null;
    this.domNode.remove();

    return this;
  }

  breadthFirstTraverse(callback) {
    const queue = [this];

    while (queue.length) {
      const node = queue.shift();

      callback(node);

      if (node.children) {
        node.children.forEach((child) => queue.push(child));
      }
    }
  }

  depthFirstTraverse(callback) {
    const stack = [this];

    while (stack.length) {
      const node = stack.shift();

      callback(node);

      if (node.children) {
        // Use splice ot make sure the first block in document is process first.
        node.children.forEach((child, i) => stack.splice(i, 0, child));
      }
    }
  }
}

export default TreeNode;
