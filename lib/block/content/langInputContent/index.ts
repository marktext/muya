import Content from "@muya/block/base/content";
import CodeBlock from "@muya/block/commonMark/codeBlock";
import Muya from "@muya/index";
import { Cursor } from "@muya/selection/types";
import { ICodeBlockState } from "@muya/state/types";
import { getHighlightHtml } from "@muya/utils/highlightHTML";

class LangInputContent extends Content {
  public parent: CodeBlock | null = null;

  static blockName = "language-input";

  static create(muya: Muya, state: ICodeBlockState) {
    const content = new LangInputContent(muya, state);

    return content;
  }

  constructor(muya: Muya, { meta }: ICodeBlockState) {
    super(muya, meta.lang);
    this.classList = [...this.classList, "mu-language-input"];
    this.attributes.hint = muya.i18n.t("Input Language Identifier...");
    this.createDomNode();
  }

  getAnchor() {
    return this.parent;
  }

  update(_cursor?: Cursor, highlights = []) {
    this.domNode!.innerHTML = getHighlightHtml(this.text, highlights);
  }

  /**
   * Update this block lang and parent's lang, and show/hide language selector.
   * @param lang 
   */
  updateLanguage(lang: string) {
    const { start, end } = this.getCursor()!;
    this.text = lang;
    this.parent!.lang = lang;
    const startOffset = Math.min(lang.length, start.offset);
    const endOffset = Math.min(lang.length, end.offset);
    this.setCursor(startOffset, endOffset, true);
    this.muya.eventCenter.emit("content-change", { block: this });
  }

  inputHandler() {
    const textContent = this.domNode!.textContent ?? "";
    const lang = textContent.split(/\s+/)[0];
    this.updateLanguage(lang);
  }

  enterHandler(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    const { parent } = this;
    parent!.lastContentInDescendant().setCursor(0, 0);
  }

  backspaceHandler(event: Event) {
    const { start, end } = this.getCursor()!;
    const { text } = this;
    // The next if statement is used to fix Firefox compatibility issues
    if (start.offset === 1 && end.offset === 1 && text.length === 1) {
      event.preventDefault();
      const lang = "";
      this.updateLanguage(lang);
    }
    if (start.offset === 0 && end.offset === 0) {
      event.preventDefault();
      const cursorBlock = this.previousContentInContext();
      // The cursorBlock will be null, if the code block is the first block in doc.
      if (cursorBlock) {
        const offset = cursorBlock.text.length;
        cursorBlock.setCursor(offset, offset, true);
      }
    }
  }
}

export default LangInputContent;
