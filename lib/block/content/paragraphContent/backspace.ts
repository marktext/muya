import Content from "@muya/block/base/content";
import type Parent from "@muya/block/base/parent";
import Paragraph from "@muya/block/commonMark/paragraph";
import logger from "@muya/utils/logger";
import ParagraphContent from "./index";

const debug = logger("paragraph:content");

export default {
  paragraphParentType(this: ParagraphContent) {
    if (this.blockName !== "paragraph.content") {
      debug.warn("Only paragraph content can call paragraphParentType");

      return;
    }

    let parent: Parent | null = this.parent;
    let type = "paragraph";

    while (parent && !parent.isScrollPage) {
      if (
        parent.blockName === "block-quote" ||
        parent.blockName === "list-item" ||
        parent.blockName === "task-list-item"
      ) {
        type = parent.blockName;
        break;
      }

      parent = parent.parent;
    }

    return type;
  },

  handleBackspaceInParagraph(this: ParagraphContent) {
    const previousContentBlock = this.previousContentInContext();
    // Handle no previous content block, the first paragraph in document.
    if (!previousContentBlock) {
      return;
    }
    const { text: oldText } = previousContentBlock;
    const offset = oldText.length;
    previousContentBlock.text += this.text;
    this.parent!.remove();
    previousContentBlock.setCursor(offset, offset, true);
  },

  handleBackspaceInBlockQuote(this: ParagraphContent) {
    const parent = this.parent!;
    const blockQuote = parent!.parent!;
    let cursorBlock: Content | null;

    if (!parent!.isOnlyChild() && !parent!.isFirstChild()) {
      return this.handleBackspaceInParagraph();
    }

    if (parent.isOnlyChild()) {
      blockQuote.replaceWith(parent);
      cursorBlock = parent.firstContentInDescendant();
    } else if (parent.isFirstChild()) {
      const cloneParagraph = parent.clone() as Paragraph;
      blockQuote.parent!.insertBefore(cloneParagraph, blockQuote);
      parent.remove();
      cursorBlock = cloneParagraph.firstContentInDescendant();
    }

    cursorBlock!.setCursor(0, 0, true);
  },

  handleBackspaceInList(this: ParagraphContent) {
    const parent = this.parent!;
    const listItem = parent.parent!;
    const list = listItem.parent!;

    if (!parent.isFirstChild()) {
      return this.handleBackspaceInParagraph();
    }

    if (listItem.isOnlyChild()) {
      listItem.forEach((node: Parent, i: number) => {
        const paragraph = node.clone() as Parent;
        list.parent!.insertBefore(paragraph, list);
        if (i === 0) {
          paragraph.firstContentInDescendant().setCursor(0, 0, true);
        }
      });

      list.remove();
    } else if (listItem.isFirstChild()) {
      listItem.forEach((node: Parent, i: number) => {
        const paragraph = node.clone() as Parent;
        list.parent!.insertBefore(paragraph, list);
        if (i === 0) {
          paragraph.firstContentInDescendant().setCursor(0, 0, true);
        }
      });

      listItem.remove();
    } else {
      const previousListItem = listItem.prev;
      listItem.forEach((node: Parent, i: number) => {
        const paragraph = node.clone() as Parent;
        previousListItem!.append(paragraph, "user");
        if (i === 0) {
          paragraph.firstContentInDescendant().setCursor(0, 0, true);
        }
      });

      listItem.remove();
    }
  },
};
