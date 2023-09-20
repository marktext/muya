// @ts-nocheck
import Content from "@muya/block/base/content";
import prism, {
  loadedLanguages,
  transformAliasToOrigin,
} from "@muya/utils/prism/";
import ScrollPage from "@muya/block/scrollPage";
import { escapeHTML, adjustOffset } from "@muya/utils";
import { getHighlightHtml, MARKER_HASK } from "@muya/utils/highlightHTML";
import { HTML_TAGS, VOID_HTML_TAGS } from "@muya/config";
import Code from "@muya/block/commonMark/codeBlock/code";

const checkAutoIndent = (text, offset) => {
  const pairStr = text.substring(offset - 1, offset + 1);

  return /^(\{\}|\[\]|\(\)|><)$/.test(pairStr);
};

const getIndentSpace = (text) => {
  const match = /^(\s*)\S/.exec(text);

  return match ? match[1] : "";
};

/**
 * parseSelector
 * div#id.className => {tag: 'div', id: 'id', className: 'className', isVoid: false}
 */

const parseSelector = (str = "") => {
  const REG_EXP = /(#|\.)([^#.]+)/;
  let tag = "";
  let id = "";
  let className = "";
  let isVoid = false;
  let cap;

  for (const tagName of HTML_TAGS) {
    if (
      str.startsWith(tagName) &&
      (!str[tagName.length] || /#|\./.test(str[tagName.length]))
    ) {
      tag = tagName;
      if (VOID_HTML_TAGS.indexOf(tagName as any) > -1) isVoid = true;
      str = str.substring(tagName.length);
    }
  }

  if (tag !== "") {
    cap = REG_EXP.exec(str);
    while (cap && str.length) {
      if (cap[1] === "#") {
        id = cap[2];
      } else {
        className = cap[2];
      }
      str = str.substring(cap[0].length);
      cap = REG_EXP.exec(str);
    }
  }

  return { tag, id, className, isVoid };
};

const LANG_HASH = {
  "html-block": "html",
};

class CodeBlockContent extends Content {
  public initialLang: string;
  public parent: Code;

  static blockName = "codeblock.content";

  static create(muya, state) {
    const content = new CodeBlockContent(muya, state);

    return content;
  }

  get lang() {
    const { codeContainer } = this;

    return codeContainer ? codeContainer.lang : this.initialLang;
  }

  /**
   * Always be the `pre` element
   */
  get codeContainer() {
    return this.parent?.parent;
  }

  get outContainer() {
    const { codeContainer } = this;

    return /code-block|frontmatter/.test(codeContainer.blockName)
      ? codeContainer
      : codeContainer.parent;
  }

  constructor(muya, state) {
    super(muya, state.text);
    this.initialLang = state.meta?.lang ?? LANG_HASH[state.name];
    this.classList = [...this.classList, "mu-codeblock-content"];
    this.attributes.frontMatter = muya.i18n.t("Input Front Matter...");
    this.attributes.math = muya.i18n.t("Input Mathematical Formula...");
    this.createDomNode();
  }

  getAnchor() {
    return this.outContainer;
  }

  update(_, highlights = []) {
    const { lang, text } = this;
    // transform alias to original language
    const fullLengthLang = transformAliasToOrigin([lang])[0];
    const domNode = this.domNode;
    const code = escapeHTML(getHighlightHtml(text, highlights, true, true))
      .replace(new RegExp(MARKER_HASK["<"], "g"), "<")
      .replace(new RegExp(MARKER_HASK[">"], "g"), ">")
      .replace(new RegExp(MARKER_HASK['"'], "g"), '"')
      .replace(new RegExp(MARKER_HASK["'"], "g"), "'");

    if (
      fullLengthLang &&
      /\S/.test(code) &&
      loadedLanguages.has(fullLengthLang)
    ) {
      const wrapper = document.createElement("div");
      wrapper.classList.add(`language-${fullLengthLang}`);
      wrapper.innerHTML = code;
      prism.highlightElement(wrapper, false, function () {
        domNode.innerHTML = this.innerHTML;
      });
    } else {
      domNode.innerHTML = code;
    }
  }

  inputHandler(event: InputEvent): void {
    if (this.isComposed) {
      return;
    }

    const textContent = this.domNode.textContent;
    const { start, end } = this.getCursor();
    const { needRender, text } = this.autoPair(
      event,
      textContent,
      start,
      end,
      false,
      false,
      "codeblock.content"
    );
    this.text = text;

    // Update html preview if the out container is `html-block`
    if (/html-block|math-block|diagram/.test(this.outContainer.blockName)) {
      (this.outContainer.attachments.head as any).update(text);
    }

    if (needRender) {
      this.setCursor(start.offset, end.offset, true);
    } else {
      // TODO: throttle render
      this.setCursor(start.offset, end.offset, true);
    }
  }

  enterHandler(event: KeyboardEvent): void {
    event.preventDefault();

    // Shift + Enter to jump out of code block.
    if (event.shiftKey) {
      let cursorBlock;
      const nextContentBlock = this.nextContentInContext();
      if (nextContentBlock) {
        cursorBlock = nextContentBlock;
      } else {
        const newNodeState = {
          name: "paragraph",
          text: "",
        };
        const newNode = ScrollPage.loadBlock(newNodeState.name).create(
          this.muya,
          newNodeState
        );
        this.scrollPage.append(newNode, "user");
        cursorBlock = newNode.firstChild;
      }
      const offset = adjustOffset(0, cursorBlock, event);
      cursorBlock.setCursor(offset, offset, true);

      return;
    }

    const { tabSize } = this.muya.options;
    const { start } = this.getCursor();
    const { text } = this;
    const autoIndent = checkAutoIndent(text, start.offset);
    const indent = getIndentSpace(text);

    this.text =
      text.substring(0, start.offset) +
      "\n" +
      (autoIndent ? indent + " ".repeat(tabSize) + "\n" : "") +
      indent +
      text.substring(start.offset);

    let offset = start.offset + 1 + indent.length;

    if (autoIndent) {
      offset += tabSize;
    }

    this.setCursor(offset, offset, true);
  }

  tabHandler(event: KeyboardEvent): void {
    event.preventDefault();
    const { start, end } = this.getCursor();
    const { lang, text } = this;
    const isMarkupCodeContent = /markup|html|xml|svg|mathml/.test(lang);

    if (isMarkupCodeContent) {
      const lastWordBeforeCursor = text
        .substring(0, start.offset)
        .split(/\s+/)
        .pop();
      const { tag, isVoid, id, className } =
        parseSelector(lastWordBeforeCursor);

      if (tag) {
        const preText = text.substring(
          0,
          start.offset - lastWordBeforeCursor.length
        );
        const postText = text.substring(end.offset);
        let html = `<${tag}`;
        let startOffset = 0;
        let endOffset = 0;

        switch (tag) {
          case "img":
            html += ' alt="" src=""';
            startOffset = endOffset = html.length - 1;
            break;

          case "input":
            html += ' type="text"';
            startOffset = html.length - 5;
            endOffset = html.length - 1;
            break;

          case "a":
            html += ' href=""';
            startOffset = endOffset = html.length - 1;
            break;

          case "link":
            html += ' rel="stylesheet" href=""';
            startOffset = endOffset = html.length - 1;
            break;
        }

        if (id) {
          html += ` id="${id}"`;
        }

        if (className) {
          html += ` class="${className}"`;
        }

        html += ">";

        if (startOffset === 0 && endOffset === 0) {
          startOffset = endOffset = html.length;
        }

        if (!isVoid) {
          html += `</${tag}>`;
        }

        this.text = preText + html + postText;
        this.setCursor(
          startOffset + preText.length,
          endOffset + preText.length,
          true
        );
      } else {
        this.insertTab();
      }
    } else {
      this.insertTab();
    }
  }

  backspaceHandler(event: KeyboardEvent): void {
    const { start, end } = this.getCursor();
    if (start.offset === end.offset && start.offset === 0) {
      event.preventDefault();
      const { text, muya } = this;
      const state = {
        name: "paragraph",
        text,
      };
      const newNode = ScrollPage.loadBlock(state.name).create(muya, state);
      this.outContainer.replaceWith(newNode);
      const cursorBlock = newNode.lastContentInDescendant();
      cursorBlock.setCursor(0, 0, true);
    } else if (
      start.offset === end.offset &&
      start.offset === 1 &&
      this.text === "\n"
    ) {
      event.preventDefault();
      this.text = "";
      this.setCursor(0, 0, true);
    }
  }

  keyupHandler(event: KeyboardEvent): void {
    if (this.isComposed) {
      return;
    }

    const { anchor, focus } = this.getCursor();
    const { anchor: oldAnchor, focus: oldFocus } = this.selection;

    if (
      anchor.offset !== oldAnchor.offset ||
      focus.offset !== oldFocus.offset
    ) {
      const cursor = { anchor, focus, block: this, path: this.path };

      this.selection.setSelection(cursor);
    }
  }
}

export default CodeBlockContent;
