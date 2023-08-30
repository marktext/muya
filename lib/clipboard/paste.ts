import { normalizePastedHTML, checkCopyType } from "@muya/utils/paste";
import ScrollPage from "@muya/block/scrollPage";
import { URL_REG } from "@muya/config";
import HtmlToMarkdown from "@muya/jsonState/htmlToMarkdown";
import MarkdownToState from "@muya/jsonState/markdownToState";

export default {
  async pasteHandler(event) {
    event.preventDefault();
    event.stopPropagation();

    const { muya } = this;
    const {
      bulletListMarker,
      footnote,
      isGitlabCompatibilityEnabled,
      superSubScript,
      trimUnnecessaryCodeBlockEmptyLines,
      frontMatter,
    } = muya.options;
    const { isSelectionInSameBlock, anchorBlock } = this.selection.getSelection();

    if (!isSelectionInSameBlock) {
      this.cutHandler(event);

      return this.pasteHandler(event);
    }

    if (!anchorBlock) {
      return;
    }

    const text = event.clipboardData.getData("text/plain");
    let html = event.clipboardData.getData("text/html");

    // Support pasted URLs from Firefox.
    if (URL_REG.test(text) && !/\s/.test(text) && !html) {
      html = `<a href="${text}">${text}</a>`;
    }

    // Remove crap from HTML such as meta data and styles.
    html = await normalizePastedHTML(html);
    const copyType = checkCopyType(html, text, this.pasteType);

    const { start, end } = anchorBlock.getCursor();
    const { text: content } = anchorBlock;
    let wraperBlock = anchorBlock.getAnchor();
    const originWraperBlock = wraperBlock;

    if (/html|text/.test(copyType)) {
      let markdown =
        copyType === "html" && anchorBlock.blockName !== "codeblock.content"
          ? new HtmlToMarkdown({ bulletListMarker }).generate(html)
          : text;

      if (
        /\n\n/.test(markdown) &&
        anchorBlock.blockName !== "codeblock.content"
      ) {
        if (start.offset !== end.offset) {
          anchorBlock.text =
            content.substring(0, start.offset) + content.substring(end.offset);
          anchorBlock.update();
        }
        // Has multiple paragraphs.
        const states = new MarkdownToState({
          footnote,
          isGitlabCompatibilityEnabled,
          superSubScript,
          trimUnnecessaryCodeBlockEmptyLines,
          frontMatter,
        }).generate(markdown);

        for (const state of states) {
          const newBlock = ScrollPage.loadBlock(state.name).create(muya, state);
          wraperBlock.parent.insertAfter(newBlock, wraperBlock);
          wraperBlock = newBlock;
        }

        // Remove empty paragraph when paste.
        if (originWraperBlock.blockName === 'paragraph' && originWraperBlock.getState().text === "") {
          originWraperBlock.remove();
        }

        const cursorBlock = wraperBlock.firstContentInDescendant();
        const offset = cursorBlock.text.length;
        cursorBlock.setCursor(offset, offset, true);
      } else {
        if (anchorBlock.blockName === "language-input") {
          markdown = markdown.replace(/\n/g, "");
        } else if (anchorBlock.blockName === "table.cell.content") {
          markdown = markdown.replace(/\n/g, "<br/>");
        }

        anchorBlock.text =
          content.substring(0, start.offset) +
          markdown +
          content.substring(end.offset);
        const offset = start.offset + markdown.length;
        anchorBlock.setCursor(offset, offset, true);
        // Update html preview if the out container is `html-block`
        if (
          anchorBlock.outContainer &&
          /html-block|math-block|diagram/.test(
            anchorBlock.outContainer.blockName
          )
        ) {
          anchorBlock.outContainer.attachments.head.update(anchorBlock.text);
        }
      }
    } else {
      const state = {
        name: "code-block",
        meta: {
          type: "fenced",
          lang: "html",
        },
        text,
      };
      const newBlock = ScrollPage.loadBlock(state.name).create(muya, state);
      wraperBlock.parent.insertAfter(newBlock, wraperBlock);
      const offset = text.length;

      newBlock.lastContentInDescendant().setCursor(offset, offset, true);
    }
  },
};
