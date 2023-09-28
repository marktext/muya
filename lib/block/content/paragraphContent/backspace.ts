import ParagraphContent from "./index";

import logger from "@muya/utils/logger";

const debug = logger("paragraph:content");

export default {
  paragraphParentType(this: ParagraphContent) {
    if (this.blockName !== "paragraph.content") {
      debug.warn("Only paragraph content can call paragraphParentType");

      return;
    }

    let { parent } = this;
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
    const { parent } = this;
    const blockQuote = parent!.parent;
    let cursorBlock;

    if (!parent!.isOnlyChild() && !parent!.isFirstChild()) {
      return this.handleBackspaceInParagraph();
    }

    if (parent.isOnlyChild()) {
      blockQuote.replaceWith(parent);
      cursorBlock = parent.children.head;
    } else if (parent.isFirstChild()) {
      const cloneParagraph = parent.clone();
      blockQuote.parent.insertBefore(cloneParagraph, blockQuote);
      parent.remove();
      cursorBlock = cloneParagraph.children.head;
    }

    cursorBlock.setCursor(0, 0, true);
  },

  handleBackspaceInList(this: ParagraphContent) {
    const parent = this.parent!;
    const listItem = parent!.parent!;
    const list = listItem.parent!;

    if (!parent.isFirstChild()) {
      return this.handleBackspaceInParagraph();
    }

    if (listItem.isOnlyChild()) {
      listItem.forEach((node, i: number) => {
        const paragraph = node.clone();
        list.parent!.insertBefore(paragraph, list);
        if (i === 0) {
          paragraph.firstContentInDescendant().setCursor(0, 0, true);
        }
      });

      list.remove();
    } else if (listItem.isFirstChild()) {
      listItem.forEach((node, i) => {
        const paragraph = node.clone();
        list.parent.insertBefore(paragraph, list);
        if (i === 0) {
          paragraph.firstContentInDescendant().setCursor(0, 0, true);
        }
      });

      listItem.remove();
    } else {
      const previousListItem = listItem.prev;
      listItem.forEach((node, i) => {
        const paragraph = node.clone();
        previousListItem.append(paragraph, "user");
        if (i === 0) {
          paragraph.firstContentInDescendant().setCursor(0, 0, true);
        }
      });

      listItem.remove();
    }
  },
};
