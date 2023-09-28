import { CLASS_NAMES } from "@muya/config";
import { getTextContent } from "@muya/selection/dom";
import { getCursorReference } from "@muya/utils";
import Format from "./index";

export default {
  inputHandler(this: Format, event: Event): void {
    if (this.isComposed || /historyUndo|historyRedo/.test(event.inputType)) {
      return;
    }
    const { domNode } = this;
    const { start, end } = this.getCursor();
    const textContent = getTextContent(domNode, [
      CLASS_NAMES.MU_MATH_RENDER,
      CLASS_NAMES.MU_RUBY_RENDER,
    ]);
    const isInInlineMath = this.checkCursorInTokenType(
      textContent,
      start.offset,
      "inline_math"
    );
    const isInInlineCode = this.checkCursorInTokenType(
      textContent,
      start.offset,
      "inline_code"
    );

    // eslint-disable-next-line prefer-const
    let { needRender, text } = this.autoPair(
      event,
      textContent,
      start,
      end,
      isInInlineMath,
      isInInlineCode,
      "format"
    );

    if (this.checkNotSameToken(this.text, text)) {
      needRender = true;
    }

    this.text = text;

    const cursor = {
      path: this.path,
      block: this,
      anchor: {
        offset: start.offset,
      },
      focus: {
        offset: end.offset,
      },
    };

    const checkMarkedUpdate = this.checkNeedRender(cursor);

    if (checkMarkedUpdate || needRender) {
      this.update(cursor);
    }

    this.selection.setSelection(cursor);
    // check edit emoji
    if (
      event.inputType !== "insertFromPaste" &&
      event.inputType !== "deleteByCut"
    ) {
      const editEmoji = this.checkCursorInTokenType(
        this.text,
        start.offset,
        "emoji"
      );
      if (editEmoji) {
        const { content: emojiText } = editEmoji;
        const reference = getCursorReference();

        this.muya.eventCenter.emit("muya-emoji-picker", {
          reference,
          emojiText,
          block: this,
        });
      }
    }

    // Check block convert if needed, and table cell no need to check.
    if (this.blockName !== "table.cell.content") {
      this.convertIfNeeded();
    }
  },
};
