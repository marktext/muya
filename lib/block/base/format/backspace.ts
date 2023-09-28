import { CLASS_NAMES } from "@muya/config";
import { generator, tokenizer } from "@muya/inlineRenderer/lexer";
import { getImageInfo } from "@muya/utils/image";
import type Format from "./index";

export default {
  backspaceHandler(this: Format, event: Event): void {
    const { start, end } = this.getCursor() ?? {};
    // Let input handler to handle this case.
    if (!start || !end || start?.offset !== end?.offset) {
      return;
    }

    // fix: #897 in marktext repo
    const { text } = this;
    const { footnote, superSubScript } = this.muya.options;
    const tokens = tokenizer(text, {
      options: { footnote, superSubScript },
    });
    let needRender = false;
    let preToken = null;
    let needSelectImage = false;

    for (const token of tokens) {
      // handle delete the second marker(et:*、$) in inline syntax.(Firefox compatible)
      // Fix: https://github.com/marktext/muya/issues/113
      // for example: foo **strong**|
      if (token.range.end === start.offset) {
        needRender = true;
        token.raw = token.raw.substring(0, token.raw.length - 1);
        break;
      }

      // If preToken is a syntax token, the the cursor is at offset 1, need to set the cursor manually.(Firefox compatible)
      // // Fix: https://github.com/marktext/muya/issues/113
      // for example: foo **strong**w|
      if (
        token.range.start + 1 === start.offset
      ) {
        needRender = true;
        token.raw = token.raw.substring(1);
        break;
      }

      // handle pre token is a image, need preventdefault.
      if (
        token.range.start + 1 === start.offset &&
        preToken &&
        preToken.type === "image"
      ) {
        needSelectImage = true;
        needRender = true;
        token.raw = token.raw.substring(1);
        break;
      }

      preToken = token;
    }

    if (needRender) {
      event.preventDefault();
      this.text = generator(tokens);

      start.offset--;
      end.offset--;
      this.setCursor(start.offset, end.offset, true);
    }

    if (needSelectImage) {
      event.stopPropagation();
      const images: NodeListOf<HTMLImageElement> = this.domNode!.querySelectorAll(
        `.${CLASS_NAMES.MU_INLINE_IMAGE}`
      );
      const imageWrapper = images[images.length - 1];
      const imageInfo = getImageInfo(imageWrapper);

      this.muya.editor.selection.selectedImage = Object.assign({}, imageInfo, {
        block: this,
      });
      this.muya.editor.activeContentBlock = null;
      this.muya.editor.selection.setSelection({
        anchor: null,
        focus: null,
        block: this,
        path: this.path,
      });
    }
  },
};
