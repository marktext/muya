import { CLASS_NAMES } from "@muya/config";
import { getCursorReference } from "@muya/utils";
import type Format from "./index";

export default {
  handleClickInlineRuleRender(this: Format, event, inlineRuleRenderEle) {
    event.preventDefault();
    event.stopPropagation();
    const startOffset = +inlineRuleRenderEle.getAttribute("data-start");
    const endOffset = +inlineRuleRenderEle.getAttribute("data-end");

    return this.setCursor(startOffset, endOffset, true);
  },

  clickHandler(this: Format, event: Event): void {
    // Handler click inline math and inline ruby html.
    const { target } = event;
    const inlineRuleRenderEle =
      target.closest(`.${CLASS_NAMES.MU_MATH_RENDER}`) ||
      target.closest(`.${CLASS_NAMES.MU_RUBY_RENDER}`);

    if (inlineRuleRenderEle) {
      return this.handleClickInlineRuleRender(event, inlineRuleRenderEle);
    }

    requestAnimationFrame(() => {
      // TODO: @JOCS, remove use this.selection directly.
      if (event.shiftKey && this.selection.anchorBlock !== this) {
        // TODO: handle select multiple paragraphs
        return;
      }

      const currentCursor = this.getCursor();

      if (!currentCursor) {
        return;
      }

      const cursor = Object.assign({}, currentCursor, {
        block: this,
        path: this.path,
      });

      // TODO: The codes bellow maybe is wrong? and remove use this.selection directly
      const needRender =
        this.selection.anchorBlock === this
          ? this.checkNeedRender(cursor) || this.checkNeedRender()
          : this.checkNeedRender(cursor);

      if (needRender) {
        this.update(cursor);
      }

      this.selection.setSelection(cursor);

      // Check and show format picker
      if (cursor.start.offset !== cursor.end.offset) {
        const reference = getCursorReference();

        this.muya.eventCenter.emit("muya-format-picker", {
          reference,
          block: this,
        });
      }
    });
  },
};
