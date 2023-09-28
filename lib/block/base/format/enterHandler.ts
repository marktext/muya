import ScrollPage from "@muya/block";
import Format from "./index";

export default {
  shiftEnterHandler(this: Format, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const { text: oldText } = this;
    const { start, end } = this.getCursor()!;
    this.text =
      oldText.substring(0, start.offset) + "\n" + oldText.substring(end.offset);
    this.setCursor(start.offset + 1, end.offset + 1, true);
  },

  enterHandler(this: Format, event: KeyboardEvent): void {
    event.preventDefault();
    const { text: oldText, muya, parent } = this;
    const { start, end } = this.getCursor()!;
    this.text = oldText.substring(0, start.offset);
    const textOfNewNode = oldText.substring(end.offset);
    const newParagraphState = {
      name: "paragraph",
      text: textOfNewNode,
    };

    const newNode = ScrollPage.loadBlock(newParagraphState.name).create(
      muya,
      newParagraphState
    );

    parent!.parent!.insertAfter(newNode, parent);

    this.update();
    const cursorBlock = newNode.firstContentInDescendant();
    cursorBlock.setCursor(0, 0, true);
  },
};
