import Format from "@muya/block/base/format";
import Parent from "@muya/block/base/parent";
import BulletList from "@muya/block/commonMark/bulletList";
import ListItem from "@muya/block/commonMark/listItem";
import OrderList from "@muya/block/commonMark/orderList";
import Paragraph from "@muya/block/commonMark/paragraph";
import TaskList from "@muya/block/gfm/taskList";
import TaskListItem from "@muya/block/gfm/taskListItem";
import ScrollPage from "@muya/block/scrollPage";
import { HTML_TAGS, VOID_HTML_TAGS } from "@muya/config";
import Muya from "@muya/index";
import { Cursor } from "@muya/selection/types";
import { isKeyboardEvent, isLengthEven, methodMixins } from "@muya/utils";
import logger from "@muya/utils/logger";
import { IBlockQuoteState, ITaskListItemState } from "../../../state/types";
import backspaceHandler from "./backspace";
import tabHandler from "./tab";

const HTML_BLOCK_REG = /^<([a-zA-Z\d-]+)(?=\s|>)[^<>]*?>$/;
const checkQuickInsert = (text: string) => /^[/、]\S*$/.test(text);
const checkShowPlaceholder = (text: string) => /^[/、]$/.test(text);

const debug = logger("paragraphContent");

const parseTableHeader = (text: string) => {
  const rowHeader = [];
  const len = text.length;
  let i;

  for (i = 0; i < len; i++) {
    const char = text[i];
    if (/^[^|]$/.test(char)) {
      rowHeader[rowHeader.length - 1] += char;
    }

    if (/\\/.test(char)) {
      rowHeader[rowHeader.length - 1] += text[++i];
    }

    if (/\|/.test(char) && i !== len - 1) {
      rowHeader.push("");
    }
  }

  return rowHeader;
};

type BackspaceHandler = typeof backspaceHandler;

interface ParagraphContent extends BackspaceHandler {}

@methodMixins(backspaceHandler, tabHandler)
class ParagraphContent extends Format {
  public parent: Paragraph | null = null;

  static blockName = "paragraph.content";

  static create(muya: Muya, text: string) {
    const content = new ParagraphContent(muya, text);

    return content;
  }

  constructor(muya: Muya, text: string) {
    super(muya, text);
    this.classList = [...this.classList, "mu-paragraph-content"];
    this.attributes["empty-hint"] = muya.i18n.t("Type / to insert...");
    this.createDomNode();
  }

  getAnchor() {
    return this.parent;
  }

  update(cursor?: Cursor, highlights = []) {
    this.inlineRenderer.patch(this, cursor, highlights);
    const { label } = this.inlineRenderer.getLabelInfo(this);
    if (this.scrollPage && label) {
      this.scrollPage.updateRefLinkAndImage(label);
    }
  }

  inputHandler(event: Event) {
    super.inputHandler(event);
    const { text, domNode } = this;
    const { eventCenter, i18n } = this.muya;
    // Check weather need to show code picker
    const token = text.match(/(^ {0,3}`{3,})([^` ]+)/);
    if (token && token[2]) {
      eventCenter.emit("muya-code-picker", {
        reference: domNode,
        block: this,
        lang: token[2],
      });
    } else {
      eventCenter.emit("muya-code-picker", { reference: null });
    }
    // Check weather need to show quick insert panel
    const needToShowQuickInsert = checkQuickInsert(text);
    const needToShowPlaceholder = checkShowPlaceholder(text);
    if (needToShowPlaceholder) {
      domNode!.setAttribute("placeholder", i18n.t("Search keyword..."));
    } else {
      domNode!.removeAttribute("placeholder");
    }

    eventCenter.emit("muya-quick-insert", {
      reference: domNode,
      block: this,
      status: !!needToShowQuickInsert,
    });
  }

  enterConvert(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    const TABLE_BLOCK_REG = /^\|.*?(\\*)\|.*?(\\*)\|/;
    const MATH_BLOCK_REG = /^\$\$/;
    const { text } = this;
    const codeBlockToken = text.match(/(^ {0,3}`{3,})([^` ]*)/);
    const tableMatch = TABLE_BLOCK_REG.exec(text);
    const htmlMatch = HTML_BLOCK_REG.exec(text);
    const mathMath = MATH_BLOCK_REG.exec(text);
    const tagName =
      htmlMatch && htmlMatch[1] && HTML_TAGS.find((t) => t === htmlMatch[1]);

    if (mathMath) {
      const state = {
        name: "math-block",
        text: "",
        meta: {
          mathStyle: "",
        },
      };
      const mathBlock = ScrollPage.loadBlock("math-block").create(
        this.muya,
        state
      );
      this.parent!.replaceWith(mathBlock);
      mathBlock.firstContentInDescendant().setCursor(0, 0);
    } else if (codeBlockToken) {
      // Convert to code block
      const lang = codeBlockToken[2];
      const state = {
        name: "code-block",
        meta: {
          lang,
          type: "fenced",
        },
        text: "",
      };
      const codeBlock = ScrollPage.loadBlock(state.name).create(
        this.muya,
        state
      );

      this.parent!.replaceWith(codeBlock);

      codeBlock.lastContentInDescendant().setCursor(0, 0);
    } else if (
      tableMatch &&
      isLengthEven(tableMatch[1]) &&
      isLengthEven(tableMatch[2])
    ) {
      const tableHeader = parseTableHeader(this.text);
      const tableBlock = ScrollPage.loadBlock("table").createWithHeader(
        this.muya,
        tableHeader
      );

      this.parent!.replaceWith(tableBlock);

      // Set cursor at the first cell of second row.
      tableBlock.firstChild
        .find(1)
        .firstContentInDescendant()
        .setCursor(0, 0, true);
    } else if (tagName && VOID_HTML_TAGS.every(tag => tag !== tagName)) {
      const state = {
        name: "html-block",
        text: `<${tagName}>\n\n</${tagName}>`,
      };
      const htmlBlock = ScrollPage.loadBlock("html-block").create(
        this.muya,
        state
      );
      this.parent!.replaceWith(htmlBlock);
      const offset = tagName.length + 3;
      htmlBlock.firstContentInDescendant().setCursor(offset, offset);
    } else {
      return super.enterHandler(event);
    }
  }

  enterInBlockQuote(event: Event) {
    const { text, parent } = this;
    if (text.length !== 0) {
      return super.enterHandler(event);
    }

    event.preventDefault();
    event.stopPropagation();

    const newNode = parent!.clone() as Paragraph;
    const blockQuote = parent!.parent;

    switch (true) {
      case parent!.isOnlyChild():
        blockQuote!.parent!.insertBefore(newNode, blockQuote);
        blockQuote!.remove();
        break;

      case parent!.isFirstChild():
        blockQuote!.parent!.insertBefore(newNode, blockQuote);
        parent!.remove();
        break;

      case parent!.isLastChild():
        blockQuote!.parent!.insertAfter(newNode, blockQuote);
        parent!.remove();
        break;

      default: {
        const newBlockState: IBlockQuoteState = {
          name: "block-quote",
          children: [],
        };
        const offset = blockQuote!.offset(parent);
        blockQuote!.forEachAt(offset + 1, undefined, (node: Parent) => {
          newBlockState.children.push(node.getState());
          node.remove();
        });
        const newBlockQuote = ScrollPage.loadBlock(newBlockState.name).create(
          this.muya,
          newBlockState
        );
        blockQuote!.parent!.insertAfter(newNode, blockQuote);
        blockQuote!.parent!.insertAfter(newBlockQuote, newNode);
        parent!.remove();
        break;
      }
    }

    (newNode.children.head as ParagraphContent).setCursor(0, 0, true);
  }

  enterInListItem(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    const { text, parent, muya } = this;
    const { start, end } = this.getCursor()!;
    const listItem = parent!.parent!;
    const list = listItem!.parent! as BulletList | OrderList | TaskList;

    if (text.length === 0) {
      if (parent!.isOnlyChild()) {
        switch (true) {
          case listItem.isOnlyChild(): {
            const newParagraph = parent!.clone() as Paragraph;
            list.replaceWith(newParagraph);
            newParagraph.firstContentInDescendant().setCursor(0, 0);
            break;
          }

          case listItem.isFirstChild(): {
            const newParagraph = parent!.clone() as Paragraph;
            listItem.remove();
            list.parent!.insertBefore(newParagraph, list);
            newParagraph.firstContentInDescendant().setCursor(0, 0);
            break;
          }

          case listItem.isLastChild(): {
            const newParagraph = parent!.clone() as Paragraph;
            listItem.remove();
            list.parent!.insertAfter(newParagraph, list);
            newParagraph.firstContentInDescendant().setCursor(0, 0);
            break;
          }

          default: {
            const newParagraph = parent!.clone() as Paragraph;
            const newListState = {
              name: list.blockName,
              meta: { ...list.meta },
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              children: [] as any,
            };
            const offset = list.offset(listItem);
            list.forEachAt(offset + 1, undefined, (node: TaskListItem | ListItem) => {
              newListState.children.push(node.getState());
              node.remove();
            });
            const newList = ScrollPage.loadBlock(newListState.name).create(
              this.muya,
              newListState
            );
            list.parent!.insertAfter(newParagraph, list);
            list.parent!.insertAfter(newList, newParagraph);
            listItem.remove();
            newParagraph.firstContentInDescendant().setCursor(0, 0);
            break;
          }
        }
      } else {
        const newListItemState = {
          name: listItem.blockName,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          children: [] as any,
        };

        if (listItem.blockName === "task-list-item") {
          (newListItemState as unknown as ITaskListItemState).meta = { checked: false };
        }

        const offset = listItem.offset(parent);
        listItem.forEachAt(offset, undefined, (node: TaskListItem | ListItem) => {
          newListItemState.children.push(node.getState());
          node.remove();
        });

        const newListItem = ScrollPage.loadBlock(newListItemState.name).create(
          this.muya,
          newListItemState
        );
        list.insertAfter(newListItem, listItem);

        newListItem.firstContentInDescendant().setCursor(0, 0);
      }
    } else {
      if (parent!.isOnlyChild()) {
        this.text = text.substring(0, start.offset);
        const newNodeState = {
          name: listItem.blockName,
          children: [
            {
              name: "paragraph",
              text: text.substring(end.offset),
            },
          ],
        };

        if (listItem.blockName === "task-list-item") {
          (newNodeState as ITaskListItemState).meta = {
            checked: false,
          };
        }

        const newListItem = ScrollPage.loadBlock(newNodeState.name).create(
          muya,
          newNodeState
        );

        list.insertAfter(newListItem, listItem);

        this.update();
        newListItem.firstContentInDescendant().setCursor(0, 0, true);
      } else {
        super.enterHandler(event);
      }
    }
  }

  enterHandler(event: Event) {
    if (!isKeyboardEvent(event)) {
      return;
    }
    if (event.shiftKey) {
      return this.shiftEnterHandler(event);
    }

    const type = this.paragraphParentType();

    if (type === "block-quote") {
      this.enterInBlockQuote(event);
    } else if (type === "list-item" || type === "task-list-item") {
      this.enterInListItem(event);
    } else {
      this.enterConvert(event);
    }
  }

  backspaceHandler(event: Event) {
    const { start, end } = this.getCursor()!;

    if (start.offset === 0 && end.offset === 0) {
      event.preventDefault();
      const type = this.paragraphParentType();

      switch (type) {
        case "paragraph":
          return this.handleBackspaceInParagraph();

        case "block-quote":
          return this.handleBackspaceInBlockQuote();

        case "list-item":
        // fall through
        case "task-list-item":
          return this.handleBackspaceInList();

        default:
          debug.error("Unknown backspace type");
          break;
      }
    } else {
      super.backspaceHandler(event);
    }
  }
}

export default ParagraphContent;
