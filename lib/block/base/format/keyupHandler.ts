import { getCursorReference } from "@muya/utils";

export default {
  keyupHandler(event: KeyboardEvent): void {
    if (this.isComposed) {
      return;
    }
    // TODO: @JOCS remove use this.selection directly
    const {
      anchor: oldAnchor,
      focus: oldFocus,
      isSelectionInSameBlock,
    } = this.selection;

    if (!isSelectionInSameBlock) {
      return;
    }

    const { anchor, focus } = this.getCursor();

    if (
      anchor.offset !== oldAnchor.offset ||
      focus.offset !== oldFocus.offset
    ) {
      const needUpdate =
        this.checkNeedRender({ anchor, focus }) || this.checkNeedRender();
      const cursor = { anchor, focus, block: this, path: this.path };

      if (needUpdate) {
        this.update(cursor);
      }

      this.selection.setSelection(cursor);
    }

    // Check not edit emoji
    const editEmoji = this.checkCursorInTokenType(
      this.text,
      anchor.offset,
      "emoji"
    );
    if (!editEmoji) {
      this.muya.eventCenter.emit("muya-emoji-picker", {
        emojiText: "",
      });
    }

    // Check and show format picker
    if (anchor.offset !== focus.offset) {
      const reference = getCursorReference();

      this.muya.eventCenter.emit("muya-format-picker", {
        reference,
        block: this,
      });
    }
  },
};
