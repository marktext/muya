import diff from "fast-diff";
import { BRACKET_HASH, BACK_HASH, EVENT_KEYS } from "@muya/config";
import { diffToTextOp, mixins } from "@muya/utils";
import TreeNode from "@muya/block/base/treeNode";
import arrowHandler from "./arrow";

// import logger from '@muya/utils/logger'

// const debug = logger('block.content:')

class Content extends TreeNode {
  static blockName = "content";

  public _text: string;
  public isComposed: boolean;
  public backspaceHandler: (event: KeyboardEvent) => void;
  public deleteHandler: (event: KeyboardEvent) => void;
  public enterHandler: (event: KeyboardEvent) => void;
  public arrowHandler: (event: KeyboardEvent) => void;
  public tabHandler: (event: KeyboardEvent) => void;

  get hasSelection() {
    return !!this.getCursor();
  }

  get selection() {
    return this.muya.editor.selection;
  }

  get inlineRenderer() {
    return this.muya.editor.inlineRenderer;
  }

  get path() {
    const { path: pPath } = this.parent as any;

    return [...pPath, "text"];
  }

  get text() {
    return this._text;
  }

  set text(text) {
    const oldText = this._text;
    this._text = text;
    const { path } = this;
    if (this.blockName === "language-input") {
      path.pop();
      path.push("meta", "lang");
    }

    // dispatch change to modify json state
    if (oldText !== text) {
      const diffs = diff(oldText, text);
      this.jsonState.pushOperation(
        "editOp",
        path,
        "text-unicode",
        diffToTextOp(diffs)
      );
    }
  }

  get isCollapsed() {
    const { isCollapsed } = this.getCursor() ?? {};

    return isCollapsed;
  }

  constructor(muya, text) {
    super(muya);
    this.tagName = "span";
    this.classList = ["mu-content"];
    this.attributes = {
      contenteditable: true,
    };
    this._text = text;
    this.isComposed = false;
  }

  createDomNode() {
    super.createDomNode();
    this.update();
  }

  /**
   * Get cursor if selection is in this block.
   */
  getCursor() {
    const { selection } = this;
    const {
      anchor,
      focus,
      anchorBlock,
      focusBlock,
      isCollapsed,
      isSelectionInSameBlock,
    } = selection.getSelection();

    if (anchorBlock !== this || focusBlock !== this) {
      return null;
    }

    return {
      start: { offset: Math.min(anchor.offset, focus.offset) },
      end: { offset: Math.max(anchor.offset, focus.offset) },
      anchor,
      focus,
      isCollapsed,
      isSelectionInSameBlock,
    };
  }

  /**
   * Set cursor at the special position
   * @param {number} begin
   * @param {number} end
   * @param {boolean} needUpdate
   */
  setCursor(begin, end, needUpdate = false) {
    const cursor = {
      block: this,
      path: this.path,
      start: { offset: begin },
      end: { offset: end },
    };

    if (needUpdate) {
      this.update(cursor);
    }

    this.muya.editor.activeContentBlock = this;

    this.selection.setSelection(cursor);
  }

  update(cursor?) {
    const { text } = this;
    this.domNode.innerHTML = `<span class="mu-syntax-text">${text}</span>`;
  }

  composeHandler = (event) => {
    if (event.type === "compositionstart") {
      this.isComposed = true;
    } else if (event.type === "compositionend") {
      this.isComposed = false;
      // Because the compose event will not cause `input` event, So need call `inputHandler` by ourself
      this.inputHandler(event);
    }
  };

  /**
   * used in input handler
   * @param {input event} event
   */
  autoPair(
    event,
    text,
    start,
    end,
    isInInlineMath = false,
    isInInlineCode = false,
    type = "format"
  ) {
    const { anchor, focus } = this.selection;
    const oldStart = anchor.offset <= focus.offset ? anchor : focus;

    let needRender = false;

    if (this.text !== text) {
      if (start.offset === end.offset && event.type === "input") {
        const { offset } = start;
        const { autoPairBracket, autoPairMarkdownSyntax, autoPairQuote } =
          this.muya.options;
        const inputChar = text.charAt(+offset - 1);
        const preInputChar = text.charAt(+offset - 2);
        const prePreInputChar = text.charAt(+offset - 3);
        const postInputChar = text.charAt(+offset);

        if (/^delete/.test(event.inputType)) {
          // handle `deleteContentBackward` or `deleteContentForward`
          const deletedChar = this.text[offset];
          if (
            event.inputType === "deleteContentBackward" &&
            postInputChar === BRACKET_HASH[deletedChar]
          ) {
            needRender = true;
            text = text.substring(0, offset) + text.substring(offset + 1);
          }

          if (
            event.inputType === "deleteContentForward" &&
            inputChar === BACK_HASH[deletedChar]
          ) {
            needRender = true;
            start.offset -= 1;
            end.offset -= 1;
            text = text.substring(0, offset - 1) + text.substring(offset);
          }
          /* eslint-disable no-useless-escape */
        } else if (
          event.inputType.indexOf("delete") === -1 &&
          inputChar === postInputChar &&
          ((autoPairQuote && /[']{1}/.test(inputChar)) ||
            (autoPairQuote && /["]{1}/.test(inputChar)) ||
            (autoPairBracket && /[\}\]\)]{1}/.test(inputChar)) ||
            (autoPairMarkdownSyntax && /[$]{1}/.test(inputChar)) ||
            (autoPairMarkdownSyntax &&
              /[*$`~_]{1}/.test(inputChar) &&
              /[_*~]{1}/.test(prePreInputChar)))
        ) {
          needRender = true;
          text = text.substring(0, offset) + text.substring(offset + 1);
        } else {
          /* eslint-disable no-useless-escape */
          // Not Unicode aware, since things like \p{Alphabetic} or \p{L} are not supported yet

          if (
            !/\\/.test(preInputChar) &&
            ((autoPairQuote &&
              /[']{1}/.test(inputChar) &&
              !/[a-zA-Z\d]{1}/.test(preInputChar)) ||
              (autoPairQuote && /["]{1}/.test(inputChar)) ||
              (autoPairBracket && /[\{\[\(]{1}/.test(inputChar)) ||
              (type === "format" &&
                !isInInlineMath &&
                !isInInlineCode &&
                autoPairMarkdownSyntax &&
                !/[a-z0-9]{1}/i.test(preInputChar) &&
                /[*$`~_]{1}/.test(inputChar)))
          ) {
            needRender = true;
            text = BRACKET_HASH[event.data]
              ? text.substring(0, offset) +
                BRACKET_HASH[inputChar] +
                text.substring(offset)
              : text;
          }

          /* eslint-enable no-useless-escape */
          // Delete the last `*` of `**` when you insert one space between `**` to create a bullet list.
          if (
            type === "format" &&
            /\s/.test(event.data) &&
            /^\* /.test(text) &&
            preInputChar === "*" &&
            postInputChar === "*"
          ) {
            text = text.substring(0, offset) + text.substring(offset + 1);
            needRender = true;
          }
        }
      }

      // Just work for `Shift + Enter` to create a soft and hard line break.
      if (
        this.text.endsWith("\n") &&
        start.offset === text.length &&
        (event.inputType === "insertText" || event.type === "compositionend")
      ) {
        text = this.text + event.data;
        start.offset++;
        end.offset++;
      } else if (
        this.text.length === oldStart.offset &&
        this.text[oldStart.offset - 2] === "\n" &&
        event.inputType === "deleteContentBackward"
      ) {
        text = this.text.substring(0, oldStart.offset - 1);
        start.offset = text.length;
        end.offset = text.length;
      }
    }

    return { text, needRender };
  }

  insertTab() {
    const { muya, text } = this;
    const { tabSize } = muya.options;
    const tabCharacter = String.fromCharCode(160).repeat(tabSize);
    const { start, end } = this.getCursor();

    if (this.isCollapsed) {
      this.text =
        text.substring(0, start.offset) +
        tabCharacter +
        text.substring(end.offset);
      const offset = start.offset + tabCharacter.length;

      this.setCursor(offset, offset, true);
    }
  }

  // Do nothing, because this method will implemented in sub class.
  inputHandler(event?) {}

  keydownHandler = (event) => {
    // TODO: move codes bellow to muya.ui ?
    if (
      this.muya.ui.shownFloat.size > 0 &&
      (event.key === EVENT_KEYS.Enter ||
        event.key === EVENT_KEYS.Escape ||
        event.key === EVENT_KEYS.Tab ||
        event.key === EVENT_KEYS.ArrowUp ||
        event.key === EVENT_KEYS.ArrowDown)
    ) {
      let needPreventDefault = false;

      for (const tool of this.muya.ui.shownFloat) {
        if (
          tool.name === "mu-format-picker" ||
          tool.name === "mu-table-picker" ||
          tool.name === "mu-quick-insert" ||
          tool.name === "mu-emoji-picker" ||
          tool.name === "mu-front-menu" ||
          tool.name === "mu-list-picker" ||
          tool.name === "mu-image-selector" ||
          tool.name === "mu-table-column-tools" ||
          tool.name === "mu-table-bar-tools"
        ) {
          needPreventDefault = true;
          break;
        }
      }

      if (needPreventDefault) {
        event.preventDefault();
      }

      return;
    }

    switch (event.key) {
      case EVENT_KEYS.Backspace:
        this.backspaceHandler(event);
        break;

      case EVENT_KEYS.Delete:
        this.deleteHandler(event);
        break;

      case EVENT_KEYS.Enter:
        if (!this.isComposed) {
          this.enterHandler(event);
        }
        break;

      case EVENT_KEYS.ArrowUp: // fallthrough

      case EVENT_KEYS.ArrowDown: // fallthrough

      case EVENT_KEYS.ArrowLeft: // fallthrough

      case EVENT_KEYS.ArrowRight: // fallthrough
        if (!this.isComposed) {
          this.arrowHandler(event);
        }
        break;

      case EVENT_KEYS.Tab:
        this.tabHandler(event);
        break;
      default:
        break;
    }
  };

  keyupHandler() {}

  clickHandler() {}

  blurHandler() {
    this.scrollPage.handleBlurFromContent(this);
  }

  focusHandler() {
    this.scrollPage.handleFocusFromContent(this);
  }

  getAncestors() {
    const ancestors = [];
    let block = this.parent;

    while (block && block.isLeafBlock) {
      ancestors.push(block);
      block = block.parent;
    }

    return ancestors;
  }

  getCommonAncestors(block) {
    const myAncestors = this.getAncestors();
    const blockAncestors = block.getAncestors();

    const commonAncestors = [];

    for (const a of myAncestors) {
      if (blockAncestors.includes(a)) {
        commonAncestors.push(a);
      }
    }

    return commonAncestors;
  }

  remove() {
    super.remove();
    this.domNode.remove();
    this.domNode = null;

    return this;
  }
}

mixins(Content, arrowHandler);

export default Content;
