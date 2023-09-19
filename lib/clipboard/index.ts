/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import { mixins } from "@muya/utils";
import copy from "@muya/clipboard/copy";
import cut from "@muya/clipboard/cut";
import paste from "@muya/clipboard/paste";
import Muya from "@muya/index";

type Copy = typeof copy;
type Cut = typeof cut;
type Paste = typeof paste;

interface Clipboard extends Copy, Cut, Paste {}

class Clipboard {
  private copyType: string = "normal"; // `normal` or `copyAsMarkdown` or `copyAsHtml`
  private pasteType: string = "normal"; // `normal` or `pasteAsPlainText`
  private copyInfo: string | null = null;

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

    const copyCutHandler = (event: ClipboardEvent): void => {
      event.preventDefault();
      event.stopPropagation();

      const isCut = event.type === "cut";

      this.copyHandler(event);

      if (isCut) {
        this.cutHandler();
      }
    };

    const keydownHandler = (event: KeyboardEvent): void => {
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

      this.cutHandler();
    };

    const pasteHandler = (event: ClipboardEvent): void => {
      this.pasteHandler(event);
    };

    eventCenter.attachDOMEvent(domNode, "copy", copyCutHandler as EventListener);
    eventCenter.attachDOMEvent(domNode, "cut", copyCutHandler as EventListener);
    eventCenter.attachDOMEvent(domNode, "paste", pasteHandler as EventListener);
    eventCenter.attachDOMEvent(domNode, "keydown", keydownHandler as EventListener);
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

  copy(type: string, info: string) {
    this.copyType = type;
    this.copyInfo = info;
    document.execCommand("copy");
    this.copyType = "normal";
  }
}

mixins(Clipboard, copy, cut, paste);

export default Clipboard;
