import { mixins } from "@/utils";
import copy from "@/clipboard/copy";
import cut from "@/clipboard/cut";
import paste from "@/clipboard/paste";
import { BLOCK_DOM_PROPERTY } from "@/config";
import { findContentDOM } from "@/selection/dom";
import Muya from "@/index";

class Clipboard {
  get selection() {
    return this.muya.editor.selection;
  }

  get scrollPage() {
    return this.muya.editor.scrollPage;
  }

  public muya: Muya;
  public copyHandler: (event: Event) => void;
  public cutHandler: (event: Event) => void;
  public pasteHandler: (event: Event) => void;
  private copyType: string;
  private pasteType: string;
  private copyInfo: string;

  constructor(muya) {
    this.muya = muya;
    this.copyType = "normal"; // `normal` or `copyAsMarkdown` or `copyAsHtml`
    this.pasteType = "normal"; // `normal` or `pasteAsPlainText`
    this.copyInfo = null;

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
      if (/Alt|Option|Meta|Shift|CapsLock|ArrowUp|ArrowDown|ArrowLeft|ArrowRight/.test(key)) {
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

    return domNode && domNode[BLOCK_DOM_PROPERTY].isContentBlock
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
