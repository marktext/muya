// @ts-nocheck
import { mixins } from "@muya/utils";
import copy from "@muya/clipboard/copy";
import cut from "@muya/clipboard/cut";
import paste from "@muya/clipboard/paste";
import { BLOCK_DOM_PROPERTY } from "@muya/config";
import { findContentDOM } from "@muya/selection/dom";
import Muya from "@muya/index";

type Copy = typeof copy;
type Cut = typeof cut;
type Paste = typeof paste;

interface Clipboard extends Copy, Cut, Paste {}

class Clipboard {
  public copyHandler: (event: ClipboardEvent) => void;
  public cutHandler: (event: ClipboardEvent) => void;
  public pasteHandler: (event: ClipboardEvent) => Promise<void>;
  private copyType: string = "normal"; // `normal` or `copyAsMarkdown` or `copyAsHtml`
  private pasteType: string = "normal"; // `normal` or `pasteAsPlainText`
  private copyInfo: string = null;

  get selection() {
    return this.muya.editor.selection;
  }

  get scrollPage() {
    return this.muya.editor.scrollPage;
  }

  constructor(public muya: Muya) {
    this.listen();
  }

  listen() {
    const { domNode, eventCenter } = this.muya;

    const copyCutHandler = (event) => {
      event.preventDefault();
      event.stopPropagation();

      const isCut = event.type === "cut";

      this.copyHandler(event);

      if (isCut) {
        this.cutHandler(event);
      }
    };

    const keydownHandler = (event) => {
      const { key, metaKey } = event;

      const { isSelectionInSameBlock } = this.selection.getSelection();
      if (isSelectionInSameBlock) {
        return;
      }

      // TODO: Is there any way to identify these key bellow?
      if (
        /Alt|Option|Meta|Shift|CapsLock|ArrowUp|ArrowDown|ArrowLeft|ArrowRight/.test(
          key
        )
      ) {
        return;
      }

      if (metaKey) {
        return;
      }

      if (key === "Backspace" || key === "Delete") {
        event.preventDefault();
      }

      this.cutHandler(event);
    };

    eventCenter.attachDOMEvent(domNode, "copy", copyCutHandler);
    eventCenter.attachDOMEvent(domNode, "cut", copyCutHandler);
    eventCenter.attachDOMEvent(domNode, "paste", this.pasteHandler.bind(this));
    eventCenter.attachDOMEvent(domNode, "keydown", keydownHandler);
  }

  getTargetBlock(event) {
    const { target } = event;
    const domNode = findContentDOM(target);

    return domNode && domNode[BLOCK_DOM_PROPERTY].isContent()
      ? domNode[BLOCK_DOM_PROPERTY]
      : null;
  }

  copyAsMarkdown() {
    this.copyType = "copyAsMarkdown";
    document.execCommand("copy");
    this.copyType = "normal";
  }

  copyAsHtml() {
    this.copyType = "copyAsHtml";
    document.execCommand("copy");
    this.copyType = "normal";
  }

  pasteAsPlainText() {
    this.pasteType = "pasteAsPlainText";
    document.execCommand("paste");
    this.pasteType = "normal";
  }

  copy(type, info) {
    this.copyInfo = info;
    this.copyType = type;
    document.execCommand("copy");
    this.copyType = "normal";
  }
}

mixins(Clipboard, copy, cut, paste);

export default Clipboard;
