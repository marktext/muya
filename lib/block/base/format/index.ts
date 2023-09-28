import Content from "@muya/block/base/content";
import { tokenizer } from "@muya/inlineRenderer/lexer";
import { ImageToken } from "@muya/inlineRenderer/types";
import { Cursor } from "@muya/selection/types";
import { conflict, methodMixins } from "@muya/utils";
import { correctImageSrc } from "@muya/utils/image";
import backspaceHandler from "./backspace";
import clickHandler from "./clickHandler";
import converter from "./converter";
import deleteHandler from "./delete";
import enterHandler from "./enterHandler";
import formatMethods from "./format";
import inputHandler from "./inputHandler";
import keyupHandler from "./keyupHandler";

type FormatMethods = typeof formatMethods;
type ClickHandler = typeof clickHandler;
type EnterHandler = typeof enterHandler;
type InputHandler = typeof inputHandler;
type KeyupHandler = typeof keyupHandler;
type BackSpaceHandler = typeof backspaceHandler;
type DeleteHandler = typeof deleteHandler;
type Converter = typeof converter;

interface Format
  extends FormatMethods,
    ClickHandler,
    EnterHandler,
    InputHandler,
    KeyupHandler,
    BackSpaceHandler,
    DeleteHandler,
    Converter {}

@methodMixins(
  formatMethods,
  clickHandler,
  enterHandler,
  inputHandler,
  keyupHandler,
  backspaceHandler,
  deleteHandler,
  converter
)
abstract class Format extends Content {
  static blockName = "format";

  checkCursorInTokenType(text, offset, type) {
    const tokens = tokenizer(text, {
      hasBeginRules: false,
      options: this.muya.options,
    });

    let result = null;

    const travel = (tokens) => {
      for (const token of tokens) {
        if (token.range.start > offset) {
          break;
        }

        if (
          token.type === type &&
          offset > token.range.start &&
          offset < token.range.end
        ) {
          result = token;
          break;
        } else if (token.children) {
          travel(token.children);
        }
      }
    };

    travel(tokens);

    return result;
  }

  checkNotSameToken(oldText, text) {
    const { options } = this.muya;
    const oldTokens = tokenizer(oldText, {
      options,
    });
    const tokens = tokenizer(text, {
      options,
    });

    const oldCache = {};
    const cache = {};

    for (const { type } of oldTokens) {
      if (oldCache[type]) {
        oldCache[type]++;
      } else {
        oldCache[type] = 1;
      }
    }

    for (const { type } of tokens) {
      if (cache[type]) {
        cache[type]++;
      } else {
        cache[type] = 1;
      }
    }

    if (Object.keys(oldCache).length !== Object.keys(cache).length) {
      return true;
    }

    for (const key of Object.keys(oldCache)) {
      if (!cache[key] || oldCache[key] !== cache[key]) {
        return true;
      }
    }

    return false;
  }
  // TODO: @JOCS remove use this.selection directly
  checkNeedRender(cursor: Cursor = this.selection) {
    const { labels } = this.inlineRenderer;
    const { text } = this;
    const { start: cStart, end: cEnd, anchor, focus } = cursor;
    const anchorOffset = cStart ? cStart.offset : anchor.offset;
    const focusOffset = cEnd ? cEnd.offset : focus.offset;
    const NO_NEED_TOKEN_REG = /text|hard_line_break|soft_line_break/;

    for (const token of tokenizer(text, {
      labels,
      options: this.muya.options,
    })) {
      if (NO_NEED_TOKEN_REG.test(token.type)) continue;
      const { start, end } = token.range;
      const textLen = text.length;
      if (
        conflict(
          [Math.max(0, start - 1), Math.min(textLen, end + 1)],
          [anchorOffset, anchorOffset]
        ) ||
        conflict(
          [Math.max(0, start - 1), Math.min(textLen, end + 1)],
          [focusOffset, focusOffset]
        )
      ) {
        return true;
      }
    }

    return false;
  }

  blurHandler() {
    super.blurHandler();
    const needRender = this.checkNeedRender();
    if (needRender) {
      this.update();
    }
  }

  /**
   * Update emoji text if cursor is in emoji syntax.
   * @param {string} text emoji text
   */
  setEmoji(text) {
    // TODO: @JOCS remove use this.selection directly
    const { anchor } = this.selection;
    const editEmoji = this.checkCursorInTokenType(
      this.text,
      anchor.offset,
      "emoji"
    );
    if (editEmoji) {
      const { start, end } = editEmoji.range;
      const oldText = this.text;
      this.text =
        oldText.substring(0, start) + `:${text}:` + oldText.substring(end);
      const offset = start + text.length + 2;
      this.setCursor(offset, offset, true);
    }
  }

  replaceImage({ token }, { alt = "", src = "", title = "" }) {
    const { type } = token;
    const { start, end } = token.range;
    const oldText = this.text;
    let imageText = "";
    if (type === "image") {
      imageText = "![";
      if (alt) {
        imageText += alt;
      }
      imageText += "](";
      if (src) {
        imageText += src
          .replace(/ /g, encodeURI(" "))
          .replace(/#/g, encodeURIComponent("#"));
      }

      if (title) {
        imageText += ` "${title}"`;
      }
      imageText += ")";
    } else if (type === "html_tag") {
      const { attrs } = token;
      Object.assign(attrs, { alt, src, title });
      imageText = "<img ";

      for (const attr of Object.keys(attrs)) {
        let value = attrs[attr];
        if (value && attr === "src") {
          value = correctImageSrc(value);
        }
        imageText += `${attr}="${value}" `;
      }
      imageText = imageText.trim();
      imageText += ">";
    }

    this.text =
      oldText.substring(0, start) + imageText + oldText.substring(end);

    this.update();
  }

  updateImage(
    { imageId, token }: { imageId: string; token: ImageToken },
    attrName: string,
    attrValue: string
  ) {
    // inline/left/center/right
    const { start, end } = token.range;
    const oldText = this.text;
    let imageText = "";
    const attrs = Object.assign({}, token.attrs);
    attrs[attrName] = attrValue;

    imageText = "<img ";

    for (const attr of Object.keys(attrs)) {
      let value = attrs[attr];
      if (value && attr === "src") {
        value = correctImageSrc(value);
      }
      imageText += `${attr}="${value}" `;
    }
    imageText = imageText.trim();
    imageText += ">";
    this.text =
      oldText.substring(0, start) + imageText + oldText.substring(end);

    this.update();

    const selector = `#${
      imageId.indexOf("_") > -1 ? imageId : imageId + "_" + token.range.start
    } img`;
    const image: HTMLImageElement | null = document.querySelector(selector);

    if (image) {
      image.click();
    }
  }

  deleteImage({ token }) {
    const oldText = this.text;
    const { start, end } = token.range;
    const { eventCenter } = this.muya;

    this.text = oldText.substring(0, start) + oldText.substring(end);
    this.setCursor(start, start, true);

    // Hide image toolbar and image transformer
    eventCenter.emit("muya-transformer", { reference: null });
    eventCenter.emit("muya-image-toolbar", { reference: null });
  }
}

export default Format;
