import ScrollPage from "@muya/block";
import Format from "@muya/block/base/format";
import Muya from "@muya/index";
import { Cursor } from "@muya/selection/types";
import { isKeyboardEvent } from "@muya/utils";

class SetextHeadingContent extends Format {
  static blockName = "setextheading.content";

  static create(muya: Muya, text: string) {
    const content = new SetextHeadingContent(muya, text);

    return content;
  }

  constructor(muya: Muya, text: string) {
    super(muya, text);
    this.classList = [...this.classList, "mu-setextheading-content"];
    this.createDomNode();
  }

  getAnchor() {
    return this.parent;
  }

  update(cursor: Cursor, highlights = []) {
    return this.inlineRenderer.patch(this, cursor, highlights);
  }

  enterHandler(event: Event) {
    if(!isKeyboardEvent(event)) {
      return;
    }
    if (event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();

      return this.shiftEnterHandler(event);
    }

    const { text } = this;
    if (text.length === 0) {
      event.preventDefault();
      event.stopPropagation();

      return this.convertToParagraph(true);
    }

    const { start, end } = this.getCursor()!;

    if (start.offset === 0 && end.offset === 0) {
      event.preventDefault();
      event.stopPropagation();

      const newNodeState = {
        name: "paragraph",
        text: "",
      };

      const newParagraphBlock = ScrollPage.loadBlock(newNodeState.name).create(
        this.muya,
        newNodeState
      );
      this.parent!.parent!.insertBefore(newParagraphBlock, this.parent);
      this.setCursor(start.offset, end.offset, true);
    } else {
      super.enterHandler(event);
    }
  }

  backspaceHandler(event: Event) {
    const { start, end } = this.getCursor()!;
    if (start.offset === 0 && end.offset === 0) {
      this.convertToParagraph(true);
    } else {
      super.backspaceHandler(event);
    }
  }
}

export default SetextHeadingContent;
