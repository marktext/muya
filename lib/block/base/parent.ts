import LinkedList from "@muya/block/base/linkedList/linkedList";
import TreeNode from "@muya/block/base/treeNode";
import { CLASS_NAMES } from "@muya/config";
import Muya from "@muya/index";
import { operateClassName } from "@muya/utils/dom";
import logger from "@muya/utils/logger";
import { TState } from "../../state/types";
import Content from "./content/index";

const debug = logger("parent:");

abstract class Parent extends TreeNode {
  // Used to store icon, checkbox(span) etc. these blocks are not in children properties in json state.
  public attachments: LinkedList<Parent> = new LinkedList();
  public children: LinkedList<TreeNode> = new LinkedList();
  public prev: Parent | null = null;
  public next: Parent | null = null;

  private _active: boolean = false;

  get active() {
    return this._active;
  }

  set active(value) {
    this._active = value;
    if (value) {
      operateClassName(this.domNode!, "add", CLASS_NAMES.MU_ACTIVE);
    } else {
      operateClassName(this.domNode!, "remove", CLASS_NAMES.MU_ACTIVE);
    }
  }

  get firstChild() {
    return this.children.head;
  }

  get lastChild() {
    return this.children.tail;
  }

  get isContainerBlock() {
    return /block-quote|order-list|bullet-list|task-list|list-item|task-list-item/.test(
      this.blockName
    );
  }

  constructor(muya: Muya) {
    super(muya);
  }

  abstract getState(): TState;

  getJsonPath() {
    const { path } = this;
    if (this.isContainerBlock) {
      path.pop();
    }

    return path;
  }

  /**
   * Clone itself.
   */
  clone() {
    const state = this.getState();
    const { muya } = this;

    return this.static.create(muya, state);
  }

  /**
   * Return the length of children.
   */
  length() {
    return this.reduce((acc: number) => acc + 1, 0);
  }

  offset(node: TreeNode) {
    return this.children.offset(node);
  }

  find(offset: number) {
    return this.children.find(offset);
  }

  /**
   * Append node in linkedList, mounted it into the DOM tree, dispatch operation if necessary.
   * @param  {...any} args
   */
  append(...childrenAndSource: [...Parent[], string]): void;
  append(...children: Parent[]): void;
  append(...args: unknown[]) {
    const source =
      typeof args[args.length - 1] === "string" ? args.pop() : "api";

    (args as Parent[]).forEach((node) => {
      node.parent = this;
      const { domNode } = node;
      this.domNode!.appendChild(domNode!);
    });

    this.children.append(...(args as Parent[]));

    // push operations
    if (source === "user") {
      (args as Parent[]).forEach((node) => {
        const path = node.getJsonPath();
        const state = node.getState();
        this.jsonState.pushOperation("insertOp", path, state);
      });
    }
  }

  /**
   * This method will only be used when initialization.
   * @param  {...any} nodes attachment blocks
   */
  appendAttachment(...nodes: Parent[]) {
    nodes.forEach((node) => {
      node.parent = this;
      const { domNode } = node;
      this.domNode!.appendChild(domNode!);
    });

    this.attachments.append(...nodes);
  }

  forEachAt(
    index: number,
    length: number = this.length(),
    callback: (cur: TreeNode, i: number) => void
  ) {
    return this.children.forEachAt(index, length, callback);
  }

  forEach(callback: (cur: TreeNode, i: number) => void) {
    return this.children.forEach(callback);
  }

  map<M>(callback: (cur: TreeNode, i: number) => M): M[] {
    return this.children.map(callback);
  }

  reduce<M>(
    callback: (memo: M, cur: TreeNode, i: number) => M,
    initialValue: M
  ): M {
    return this.children.reduce<M>(callback, initialValue);
  }

  /**
   * Use the `block` to replace the current block(this)
   * @param {TreeNode} block
   */
  replaceWith(block: Parent, source = "user") {
    if (!this.parent) {
      debug.warn("Call replaceWith need has a parent block");

      return;
    }

    this.parent.insertBefore(block, this, source);
    block.parent = this.parent;
    this.remove(source);

    return block;
  }

  insertBefore(newNode: Parent, refNode: Parent | null = null, source = "user") {
    newNode.parent = this;
    this.children.insertBefore(newNode, refNode);
    this.domNode!.insertBefore(
      newNode.domNode!,
      refNode ? refNode.domNode : null
    );

    if (source === "user") {
      // dispatch json1 operation
      const path = newNode.getJsonPath();
      const state = newNode.getState();
      this.jsonState.pushOperation("insertOp", path, state);
    }

    return newNode;
  }

  insertAfter(newNode: Parent, refNode: Parent | null = null, source = "user") {
    this.insertBefore(newNode, refNode ? refNode.next : null, source);

    return newNode;
  }

  remove(source = "user") {
    if (source === "user") {
      // dispatch json1 operation
      const path = this.getJsonPath();
      const state = this.getState();
      this.jsonState.pushOperation("removeOp", path, state);
    }

    super.remove();

    return this;
  }

  empty() {
    this.forEach((child) => {
      this.removeChild(child, "api");
    });
  }

  removeChild(node: Parent | Content, source = "user") {
    if (!this.children.contains(node)) {
      debug.warn(
        "Can not removeChild(node), because node is not child of this block"
      );
    }

    node.remove(source);

    return node;
  }

  /**
   * find the first content block, paragraph.content etc.
   */
  firstContentInDescendant(): Content {
    let firstContentBlock: Content | any = this;
    do {
      firstContentBlock = firstContentBlock.children.head;
    } while (firstContentBlock.children);

    return firstContentBlock;
  }

  /**
   * find the last content block in container block.
   */
  lastContentInDescendant(): Content {
    let lastContentBlock: Content | any = this;

    do {
      lastContentBlock = lastContentBlock.children.tail;
    } while (lastContentBlock.children);

    return lastContentBlock;
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

  depthFirstTraverse(callback: (node: Parent | Content) => void) {
    const stack: Parent | Content = [this];

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

export default Parent;
