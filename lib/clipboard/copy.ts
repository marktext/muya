import Parent from "@muya/block/base/parent";
import { getClipBoardHtml } from "@muya/utils/marked";
import StateToMarkdown from "../state/stateToMarkdown";
import Base from "./base";

class Copy extends Base {
  public copyType: string = "normal"; // `normal` or `copyAsMarkdown` or `copyAsHtml` or `copyCodeContent`
  public copyInfo: string = "";

  getClipboardData() {
    const { copyType, copyInfo } = this;
    if (copyType === "copyCodeContent") {
      return {
        html: "",
        text: copyInfo,
      };
    }

    let text = "";
    let html = "";

    const selection = this.selection.getSelection();
    if (!selection) {
      return { html, text };
    }

    const { isSelectionInSameBlock, anchor, anchorBlock, focus, focusBlock } = selection;

    const {
      frontMatter = true,
      math,
      isGitlabCompatibilityEnabled,
      superSubScript,
    } = this.muya.options;
    // Handler copy/cut in one block.
    if (isSelectionInSameBlock) {
      const begin = Math.min(anchor.offset, focus.offset);
      const end = Math.max(anchor.offset, focus.offset);

      text = anchorBlock.text.substring(begin, end);
      html = getClipBoardHtml(text, {
        frontMatter,
        math,
        isGitlabCompatibilityEnabled,
        superSubScript,
      });

      return { html, text };
    }
    // Handle select multiple blocks.
    const copyState = [];
    const anchorOutMostBlock = anchorBlock.outMostBlock;
    const focusOutMostBlock = focusBlock.outMostBlock;
    const anchorOutMostBlockOffset = this.scrollPage.offset(anchorOutMostBlock);
    const focusOutMostBlockOffset = this.scrollPage.offset(focusOutMostBlock);
    const startOutBlock =
      anchorOutMostBlockOffset <= focusOutMostBlockOffset
        ? anchorOutMostBlock
        : focusOutMostBlock;
    const endOutBlock =
      anchorOutMostBlockOffset <= focusOutMostBlockOffset
        ? focusOutMostBlock
        : anchorOutMostBlock;
    const startBlock =
      anchorOutMostBlockOffset <= focusOutMostBlockOffset
        ? anchorBlock
        : focusBlock;
    const endBlock =
      anchorOutMostBlockOffset <= focusOutMostBlockOffset
        ? focusBlock
        : anchorBlock;
    const startOffset =
      anchorOutMostBlockOffset <= focusOutMostBlockOffset
        ? anchor.offset
        : focus.offset;
    const endOffset =
      anchorOutMostBlockOffset <= focusOutMostBlockOffset
        ? focus.offset
        : anchor.offset;

    const getPartialState = (position: "start" | "end") => {
      const outBlock = position === "start" ? startOutBlock : endOutBlock;
      const block = position === "start" ? startBlock : endBlock;
      // Handle anchor and focus in different blocks
      if (
        /block-quote|code-block|html-block|table|math-block|frontmatter|diagram/.test(
          outBlock!.blockName
        )
      ) {
        copyState.push((outBlock as Parent).getState());
      } else if (/bullet-list|order-list|task-list/.test(outBlock!.blockName)) {
        const listItemBlockName =
          outBlock!.blockName === "task-list" ? "task-list-item" : "list-item";
        const listItem = block.farthestBlock(listItemBlockName);
        const offset = (outBlock as Parent).offset(listItem);
        const { name, meta, children } = (outBlock as any).getState();
        copyState.push({
          name,
          meta,
          children: children.filter((_: unknown, index: number) =>
            position === "start" ? index >= offset : index <= offset
          ),
        });
      } else {
        if (position === "start" && startOffset < startBlock.text.length) {
          copyState.push({
            name: "paragraph",
            text: startBlock.text.substring(startOffset),
          });
        } else if (position === "end" && endOffset > 0) {
          copyState.push({
            name: "paragraph",
            text: endBlock.text.substring(0, endOffset),
          });
        }
      }
    };

    if (anchorOutMostBlock === focusOutMostBlock) {
      // Handle anchor and focus in same list\quote block
      if (/block-quote|table/.test(anchorOutMostBlock!.blockName)) {
        copyState.push((anchorOutMostBlock as Parent).getState());
      } else {
        const listItemBlockName =
          anchorOutMostBlock!.blockName === "task-list"
            ? "task-list-item"
            : "list-item";
        const anchorFarthestListItem =
          anchorBlock.farthestBlock(listItemBlockName);
        const focusFarthestListItem =
          focusBlock.farthestBlock(listItemBlockName);
        const anchorOffset = (anchorOutMostBlock as Parent).offset(
          anchorFarthestListItem
        );
        const focusOffset = (anchorOutMostBlock as Parent).offset(
          focusFarthestListItem
        );
        const minOffset = Math.min(anchorOffset, focusOffset);
        const maxOffset = Math.max(anchorOffset, focusOffset);
        const { name, meta, children } = (anchorOutMostBlock as any).getState();
        copyState.push({
          name,
          meta,
          children: children.filter(
            (_: unknown, index: number) =>
              index >= minOffset && index <= maxOffset
          ),
        });
      }
    } else {
      getPartialState("start");
      // Get State between the start outmost block and the end outmost block.
      let node = startOutBlock?.next;
      while (node && node !== endOutBlock) {
        copyState.push((node as Parent).getState());
        node = node.next;
      }
      getPartialState("end");
    }

    const mdGenerator = new StateToMarkdown();

    text = mdGenerator.generate(copyState);
    html = getClipBoardHtml(text, {
      frontMatter,
      math,
      isGitlabCompatibilityEnabled,
      superSubScript,
    });

    return { html, text };
  }

  copyHandler(event: ClipboardEvent): void {
    const { html, text } = this.getClipboardData();

    const { copyType } = this;

    if (!event.clipboardData) {
      return;
    }

    switch (copyType) {
      case "normal": {
        event.clipboardData.setData("text/html", html);
        event.clipboardData.setData("text/plain", text);
        break;
      }

      case "copyAsHtml": {
        event.clipboardData.setData("text/html", "");
        event.clipboardData.setData("text/plain", html);
        break;
      }

      case "copyAsMarkdown": {
        event.clipboardData.setData("text/html", "");
        event.clipboardData.setData("text/plain", text);
        break;
      }

      case "copyCodeContent": {
        event.clipboardData.setData("text/html", "");
        event.clipboardData.setData("text/plain", text);
        break;
      }
    }
  }
}

export default Copy;
