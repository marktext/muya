/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import CodeBlockContent from '@muya/block/content/codeBlockContent';
import ScrollPage from '@muya/block/scrollPage';
import { URL_REG } from '@muya/config';
import HtmlToMarkdown from '@muya/state/htmlToMarkdown';
import MarkdownToState from '@muya/state/markdownToState';
import { getCopyTextType, normalizePastedHTML } from '@muya/utils/paste';
import Base from './base';
import Cut from './cut';

interface Paste extends Cut {}

class Paste extends Base {
  public pasteType: string = 'normal'; // `normal` or `pasteAsPlainText`

  async pasteHandler(event: ClipboardEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    const { muya } = this;
    const {
      bulletListMarker,
      footnote,
      isGitlabCompatibilityEnabled,
      math,
      trimUnnecessaryCodeBlockEmptyLines,
      frontMatter,
    } = muya.options;
    const selection = this.selection.getSelection();
    if (!selection) {
      return;
    }
    const { isSelectionInSameBlock, anchorBlock } = selection;

    if (!isSelectionInSameBlock) {
      this.cutHandler();

      return this.pasteHandler(event);
    }

    if (!anchorBlock || !event.clipboardData) {
      return;
    }

    const text = event.clipboardData.getData('text/plain');
    let html = event.clipboardData.getData('text/html');

    // Support pasted URLs from Firefox.
    if (URL_REG.test(text) && !/\s/.test(text) && !html) {
      html = `<a href="${text}">${text}</a>`;
    }

    // Remove crap from HTML such as meta data and styles.
    html = await normalizePastedHTML(html);
    const copyType = getCopyTextType(html, text, this.pasteType);

    const { start, end } = anchorBlock.getCursor()!;
    const { text: content } = anchorBlock;
    let wrapperBlock = anchorBlock.getAnchor();
    const originWrapperBlock = wrapperBlock;

    if (/html|text/.test(copyType)) {
      let markdown =
        copyType === 'html' && anchorBlock.blockName !== 'codeblock.content'
          ? new HtmlToMarkdown({ bulletListMarker }).generate(html)
          : text;

      if (
        /\n\n/.test(markdown) &&
        anchorBlock.blockName !== 'codeblock.content'
      ) {
        if (start.offset !== end.offset) {
          anchorBlock.text =
            content.substring(0, start.offset) + content.substring(end.offset);
          anchorBlock.update();
        }
        // Has multiple paragraphs.
        const states = new MarkdownToState({
          footnote,
          math,
          isGitlabCompatibilityEnabled,
          trimUnnecessaryCodeBlockEmptyLines,
          frontMatter,
        }).generate(markdown);

        for (const state of states) {
          const newBlock = ScrollPage.loadBlock(state.name).create(muya, state);
          wrapperBlock.parent.insertAfter(newBlock, wrapperBlock);
          wrapperBlock = newBlock;
        }

        // Remove empty paragraph when paste.
        if (originWrapperBlock.blockName === 'paragraph' && originWrapperBlock.getState().text === '') {
          originWrapperBlock.remove();
        }

        const cursorBlock = wrapperBlock.firstContentInDescendant();
        const offset = cursorBlock.text.length;
        cursorBlock.setCursor(offset, offset, true);
      } else {
        if (anchorBlock.blockName === 'language-input') {
          markdown = markdown.replace(/\n/g, '');
        } else if (anchorBlock.blockName === 'table.cell.content') {
          markdown = markdown.replace(/\n/g, '<br/>');
        }

        anchorBlock.text =
          content.substring(0, start.offset) +
          markdown +
          content.substring(end.offset);
        const offset = start.offset + markdown.length;
        anchorBlock.setCursor(offset, offset, true);
        // Update html preview if the out container is `html-block`
        if (
          anchorBlock instanceof CodeBlockContent &&
          anchorBlock.outContainer &&
          /html-block|math-block|diagram/.test(
            anchorBlock.outContainer.blockName
          )
        ) {
          (anchorBlock.outContainer.attachments.head as any).update(anchorBlock.text);
        }
      }
    } else {
      const state = {
        name: 'code-block',
        meta: {
          type: 'fenced',
          lang: 'html',
        },
        text,
      };
      const newBlock = ScrollPage.loadBlock(state.name).create(muya, state);
      wrapperBlock.parent.insertAfter(newBlock, wrapperBlock);
      const offset = text.length;

      newBlock.lastContentInDescendant().setCursor(offset, offset, true);
    }
  }
}

export default Paste;
