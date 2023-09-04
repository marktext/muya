import ScrollPage from "@muya/block";
import { PARAGRAPH_STATE, THEMATIC_BREAK_STATE } from "@muya/config";
import { IOrderListState, IBulletListState } from "../../../../types/state";

const INLINE_UPDATE_FRAGMENTS = [
  "(?:^|\n) {0,3}([*+-] {1,4})", // Bullet list
  "^(\\[[x ]{1}\\] {1,4})", // Task list **match from beginning**
  "(?:^|\n) {0,3}(\\d{1,9}(?:\\.|\\)) {1,4})", // Order list
  "(?:^|\n) {0,3}(#{1,6})(?=\\s{1,}|$)", // ATX headings
  "^(?:[\\s\\S]+?)\\n {0,3}(\\={3,}|\\-{3,})(?= {1,}|$)", // Setext headings **match from beginning**
  "(?:^|\n) {0,3}(>).+", // Block quote
  "^( {4,})", // Indent code **match from beginning**
  // '^(\\[\\^[^\\^\\[\\]\\s]+?(?<!\\\\)\\]: )', // Footnote **match from beginning**
  "(?:^|\n) {0,3}((?:\\* *\\* *\\*|- *- *-|_ *_ *_)[ \\*\\-\\_]*)(?=\n|$)", // Thematic break
];

const INLINE_UPDATE_REG = new RegExp(INLINE_UPDATE_FRAGMENTS.join("|"), "i");

export default {
  convertIfNeeded() {
    const { text } = this;

    const [
      match,
      bulletList,
      taskList,
      orderList,
      atxHeading,
      setextHeading,
      blockquote,
      indentedCodeBlock,
      thematicBreak,
    ] = text.match(INLINE_UPDATE_REG) || [];

    switch (true) {
      case !!thematicBreak &&
        new Set(thematicBreak.split("").filter((i) => /\S/.test(i))).size === 1:
        this.convertToThematicBreak();
        break;

      case !!bulletList:
        this.convertToList();
        break;

      case !!orderList:
        this.convertToList();
        break;

      case !!taskList:
        this.convertToTaskList();
        break;

      case !!atxHeading:
        this.convertToAtxHeading(atxHeading);
        break;

      case !!setextHeading:
        this.convertToSetextHeading(setextHeading);
        break;

      case !!blockquote:
        this.convertToBlockQuote(blockquote);
        break;

      case !!indentedCodeBlock:
        this.convertToIndentedCodeBlock(indentedCodeBlock);
        break;

      case !match:
      default:
        this.convertToParagraph();
        break;
    }
  },

  // Thematic Break
  convertToThematicBreak() {
    // If the block is already thematic break, no need to update.
    if (this.parent.blockName === "thematic-break") {
      return;
    }
    const { hasSelection } = this;
    const { start, end } = this.getCursor();
    const { text, muya } = this;
    const lines = text.split("\n");
    const preParagraphLines = [];
    let thematicLine = "";
    const postParagraphLines = [];
    let thematicLineHasPushed = false;

    for (const l of lines) {
      /* eslint-disable no-useless-escape */
      const THEMATIC_BREAK_REG =
        / {0,3}(?:\* *\* *\*|- *- *-|_ *_ *_)[ \*\-\_]*$/;
      /* eslint-enable no-useless-escape */
      if (THEMATIC_BREAK_REG.test(l) && !thematicLineHasPushed) {
        thematicLine = l;
        thematicLineHasPushed = true;
      } else if (!thematicLineHasPushed) {
        preParagraphLines.push(l);
      } else {
        postParagraphLines.push(l);
      }
    }

    const newNodeState = Object.assign({}, THEMATIC_BREAK_STATE, {
      text: thematicLine,
    });

    if (preParagraphLines.length) {
      const preParagraphState = Object.assign({}, PARAGRAPH_STATE, {
        text: preParagraphLines.join("\n"),
      });
      const preParagraphBlock = ScrollPage.loadBlock(
        preParagraphState.name
      ).create(muya, preParagraphState);
      this.parent.parent.insertBefore(preParagraphBlock, this.parent);
    }

    if (postParagraphLines.length) {
      const postParagraphState = Object.assign({}, PARAGRAPH_STATE, {
        text: postParagraphLines.join("\n"),
      });
      const postParagraphBlock = ScrollPage.loadBlock(
        postParagraphState.name
      ).create(muya, postParagraphState);
      this.parent.parent.insertAfter(postParagraphBlock, this.parent);
    }

    const thematicBlock = ScrollPage.loadBlock(newNodeState.name).create(
      muya,
      newNodeState
    );

    this.parent.replaceWith(thematicBlock);

    if (hasSelection) {
      const thematicBreakContent = thematicBlock.children.head;
      const preParagraphTextLength = preParagraphLines.reduce(
        (acc, i) => acc + i.length + 1,
        0
      ); // Add one, because the `\n`
      const startOffset = Math.max(0, start.offset - preParagraphTextLength);
      const endOffset = Math.max(0, end.offset - preParagraphTextLength);

      thematicBreakContent.setCursor(startOffset, endOffset, true);
    }
  },

  convertToList() {
    const { text, parent, muya, hasSelection } = this;
    const { preferLooseListItem } = muya.options;
    const matches = text.match(
      /^([\s\S]*?) {0,3}([*+-]|\d{1,9}(?:\.|\))) {1,4}([\s\S]*)$/
    );
    const blockName = /\d/.test(matches[2]) ? "order-list" : "bullet-list";

    if (matches[1]) {
      const paragraphState = {
        name: "paragraph",
        text: matches[1].trim(),
      };
      const paragraph = ScrollPage.loadBlock(paragraphState.name).create(
        muya,
        paragraphState
      );
      parent.parent.insertBefore(paragraph, parent);
    }

    const listState = {
      name: blockName,
      meta: {
        loose: preferLooseListItem,
      },
      children: [
        {
          name: "list-item",
          children: [
            {
              name: "paragraph",
              text: matches[3],
            },
          ],
        },
      ],
    };

    if (blockName === "order-list") {
      (listState as IOrderListState).meta.delimiter = matches[2].slice(-1);
      (listState as IOrderListState).meta.start = Number(matches[2].slice(0, -1));
    } else {
      (listState as IBulletListState).meta.marker = matches[2];
    }

    const list = ScrollPage.loadBlock(listState.name).create(muya, listState);
    parent.replaceWith(list);

    const firstContent = list.firstContentInDescendant();

    if (hasSelection) {
      firstContent.setCursor(0, 0, true);
    }

    // convert `[*-+] \[[xX ]\] ` to task list.
    const TASK_LIST_REG = /^\[[x ]\] {1,4}/i;
    if (TASK_LIST_REG.test(firstContent.text)) {
      firstContent.convertToTaskList();
    }
  },

  convertToTaskList() {
    const { text, parent, muya, hasSelection } = this;
    const { preferLooseListItem } = muya.options;
    const listItem = parent.parent;
    const list = listItem?.parent;
    const matches = text.match(/^\[([x ]{1})\] {1,4}([\s\S]*)$/i);

    if (!list || list.blockName !== "bullet-list" || !parent.isFirstChild()) {
      return;
    }

    const listState = {
      name: "task-list",
      meta: {
        loose: preferLooseListItem,
        marker: list.meta.marker,
      },
      children: [
        {
          name: "task-list-item",
          meta: {
            checked: matches[1] !== " ",
          },
          children: listItem.map((node) => {
            if (node === parent) {
              return {
                name: "paragraph",
                text: matches[2],
              };
            } else {
              return node.getState();
            }
          }),
        },
      ],
    };

    const newTaskList = ScrollPage.loadBlock(listState.name).create(
      muya,
      listState
    );

    switch (true) {
      case listItem.isOnlyChild():
        list.replaceWith(newTaskList);
        break;

      case listItem.isFirstChild():
        list.parent.insertBefore(newTaskList, list);
        listItem.remove();
        break;

      case listItem.isLastChild():
        list.parent.insertAfter(newTaskList, list);
        listItem.remove();
        break;

      default: {
        const bulletListState = {
          name: "bullet-list",
          meta: {
            loose: preferLooseListItem,
            marker: list.meta.marker,
          },
          children: [],
        };
        const offset = list.offset(listItem);
        list.forEachAt(offset + 1, undefined, (node) => {
          bulletListState.children.push(node.getState());
          node.remove();
        });

        const bulletList = ScrollPage.loadBlock(bulletListState.name).create(
          muya,
          bulletListState
        );
        list.parent.insertAfter(newTaskList, list);
        newTaskList.parent.insertAfter(bulletList, newTaskList);
        listItem.remove();
        break;
      }
    }

    if (hasSelection) {
      newTaskList.firstContentInDescendant().setCursor(0, 0, true);
    }
  },

  // ATX Heading
  convertToAtxHeading(atxHeading) {
    const level = atxHeading.length;
    if (
      this.parent.blockName === "atx-heading" &&
      this.parent.meta.level === level
    ) {
      return;
    }

    const { hasSelection } = this;
    const { start, end } = this.getCursor();
    const { text, muya } = this;
    const lines = text.split("\n");
    const preParagraphLines = [];
    let atxLine = "";
    const postParagraphLines = [];
    let atxLineHasPushed = false;

    for (const l of lines) {
      if (/^ {0,3}#{1,6}(?=\s{1,}|$)/.test(l) && !atxLineHasPushed) {
        atxLine = l;
        atxLineHasPushed = true;
      } else if (!atxLineHasPushed) {
        preParagraphLines.push(l);
      } else {
        postParagraphLines.push(l);
      }
    }

    if (preParagraphLines.length) {
      const preParagraphState = {
        name: "paragraph",
        text: preParagraphLines.join("\n"),
      };
      const preParagraphBlock = ScrollPage.loadBlock(
        preParagraphState.name
      ).create(muya, preParagraphState);
      this.parent.parent.insertBefore(preParagraphBlock, this.parent);
    }

    if (postParagraphLines.length) {
      const postParagraphState = {
        name: "paragraph",
        text: postParagraphLines.join("\n"),
      };
      const postParagraphBlock = ScrollPage.loadBlock(
        postParagraphState.name
      ).create(muya, postParagraphState);
      this.parent.parent.insertAfter(postParagraphBlock, this.parent);
    }

    const newNodeState = {
      name: "atx-heading",
      meta: {
        level,
      },
      text: atxLine,
    };

    const atxHeadingBlock = ScrollPage.loadBlock(newNodeState.name).create(
      muya,
      newNodeState
    );

    this.parent.replaceWith(atxHeadingBlock);

    if (hasSelection) {
      const atxHeadingContent = atxHeadingBlock.children.head;
      const preParagraphTextLength = preParagraphLines.reduce(
        (acc, i) => acc + i.length + 1,
        0
      ); // Add one, because the `\n`
      const startOffset = Math.max(0, start.offset - preParagraphTextLength);
      const endOffset = Math.max(0, end.offset - preParagraphTextLength);
      atxHeadingContent.setCursor(startOffset, endOffset, true);
    }
  },

  // Setext Heading
  convertToSetextHeading(setextHeading) {
    const level = /=/.test(setextHeading) ? 2 : 1;
    if (
      this.parent.blockName === "setext-heading" &&
      this.parent.meta.level === level
    ) {
      return;
    }

    const { hasSelection } = this;
    const { text, muya } = this;
    const lines = text.split("\n");
    const setextLines = [];
    const postParagraphLines = [];
    let setextLineHasPushed = false;

    for (const l of lines) {
      if (/^ {0,3}(?:={3,}|-{3,})(?= {1,}|$)/.test(l) && !setextLineHasPushed) {
        setextLineHasPushed = true;
      } else if (!setextLineHasPushed) {
        setextLines.push(l);
      } else {
        postParagraphLines.push(l);
      }
    }

    const newNodeState = {
      name: "setext-heading",
      meta: {
        level,
        underline: setextHeading,
      },
      text: setextLines.join("\n"),
    };

    const setextHeadingBlock = ScrollPage.loadBlock(newNodeState.name).create(
      muya,
      newNodeState
    );

    this.parent.replaceWith(setextHeadingBlock);

    if (postParagraphLines.length) {
      const postParagraphState = {
        name: "paragraph",
        text: postParagraphLines.join("\n"),
      };
      const postParagraphBlock = ScrollPage.loadBlock(
        postParagraphState.name
      ).create(muya, postParagraphState);
      setextHeadingBlock.parent.insertAfter(
        postParagraphBlock,
        setextHeadingBlock
      );
    }

    if (hasSelection) {
      const cursorBlock = setextHeadingBlock.children.head;
      const offset = cursorBlock.text.length;
      cursorBlock.setCursor(offset, offset, true);
    }
  },

  // Block Quote
  convertToBlockQuote() {
    const { text, muya, hasSelection } = this;
    const { start, end } = this.getCursor();
    const lines = text.split("\n");
    const preParagraphLines = [];
    const quoteLines = [];
    let quoteLinesHasPushed = false;
    let delta = 0;

    for (const l of lines) {
      if (/^ {0,3}>/.test(l) && !quoteLinesHasPushed) {
        quoteLinesHasPushed = true;
        const tokens = /( *> *)(.*)/.exec(l);
        delta = tokens[1].length;
        quoteLines.push(tokens[2]);
      } else if (!quoteLinesHasPushed) {
        preParagraphLines.push(l);
      } else {
        quoteLines.push(l);
      }
    }

    let quoteParagraphState;
    if (this.blockName === "setextheading.content") {
      quoteParagraphState = {
        name: "setext-heading",
        meta: this.parent.meta,
        text: quoteLines.join("\n"),
      };
    } else if (this.blockName === "atxheading.content") {
      quoteParagraphState = {
        name: "atx-heading",
        meta: this.parent.meta,
        text: quoteLines.join(" "),
      };
    } else {
      quoteParagraphState = {
        name: "paragraph",
        text: quoteLines.join("\n"),
      };
    }

    const newNodeState = {
      name: "block-quote",
      children: [quoteParagraphState],
    };

    const quoteBlock = ScrollPage.loadBlock(newNodeState.name).create(
      muya,
      newNodeState
    );

    this.parent.replaceWith(quoteBlock);

    if (preParagraphLines.length) {
      const preParagraphState = {
        name: "paragraph",
        text: preParagraphLines.join("\n"),
      };
      const preParagraphBlock = ScrollPage.loadBlock(
        preParagraphState.name
      ).create(muya, preParagraphState);
      quoteBlock.parent.insertBefore(preParagraphBlock, quoteBlock);
    }

    if (hasSelection) {
      // TODO: USE `firstContentInDecendent`
      const cursorBlock = quoteBlock.children.head.children.head;
      cursorBlock.setCursor(
        Math.max(0, start.offset - delta),
        Math.max(0, end.offset - delta),
        true
      );
    }
  },

  // Indented Code Block
  convertToIndentedCodeBlock() {
    const { text, muya, hasSelection } = this;
    const lines = text.split("\n");
    const codeLines = [];
    const paragraphLines = [];
    let canBeCodeLine = true;

    for (const l of lines) {
      if (/^ {4,}/.test(l) && canBeCodeLine) {
        codeLines.push(l.replace(/^ {4}/, ""));
      } else {
        canBeCodeLine = false;
        paragraphLines.push(l);
      }
    }

    const codeState = {
      name: "code-block",
      meta: {
        lang: "",
        type: "indented",
      },
      text: codeLines.join("\n"),
    };

    const codeBlock = ScrollPage.loadBlock(codeState.name).create(
      muya,
      codeState
    );
    this.parent.replaceWith(codeBlock);

    if (paragraphLines.length > 0) {
      const paragraphState = {
        name: "paragraph",
        text: paragraphLines.join("\n"),
      };
      const paragraphBlock = ScrollPage.loadBlock(paragraphState.name).create(
        muya,
        paragraphState
      );
      codeBlock.parent.insertAfter(paragraphBlock, codeBlock);
    }

    if (hasSelection) {
      const cursorBlock = codeBlock.lastContentInDescendant();
      cursorBlock.setCursor(0, 0);
    }
  },

  // Paragraph
  convertToParagraph(force = false) {
    if (
      !force &&
      (this.parent.blockName === "setext-heading" ||
        this.parent.blockName === "paragraph")
    ) {
      return;
    }

    const { text, muya, hasSelection } = this;
    const { start, end } = this.getCursor();

    const newNodeState = {
      name: "paragraph",
      text,
    };

    const paragraphBlock = ScrollPage.loadBlock(newNodeState.name).create(
      muya,
      newNodeState
    );

    this.parent.replaceWith(paragraphBlock);

    if (hasSelection) {
      const cursorBlock = paragraphBlock.children.head;
      cursorBlock.setCursor(start.offset, end.offset, true);
    }
  },
};
