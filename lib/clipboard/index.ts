/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import { mixins } from "@muya/utils";
import Muya from "@muya/index";
import Base from "./base";
import Copy from "./copy";
import Cut from "./cut";
import Paste from "./paste";

interface Clipboard extends Copy, Cut, Paste {}

@mixins(Copy, Cut, Paste)
class Clipboard extends Base {
  public copyType: string = "normal"; // `normal` or `copyAsMarkdown` or `copyAsHtml` or `copyCodeContent`
  public pasteType: string = "normal"; // `normal` or `pasteAsPlainText`
  public copyInfo: string = "";

  static create(muya: Muya) {
    const clipboard = new Clipboard(muya);
    clipboard.listen();

    return clipboard;
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

    eventCenter.attachDOMEvent(
      domNode,
      "copy",
      copyCutHandler as EventListener
    );
    eventCenter.attachDOMEvent(domNode, "cut", copyCutHandler as EventListener);
    eventCenter.attachDOMEvent(domNode, "paste", pasteHandler as EventListener);
    eventCenter.attachDOMEvent(
      domNode,
      "keydown",
      keydownHandler as EventListener
    );
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

export default Clipboard;
