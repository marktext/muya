import {
  default as Content,
  default as ContentBlock,
} from "@muya/block/base/content";
import type Format from "@muya/block/base/format";
import Parent from "@muya/block/base/parent";
import ListItem from "@muya/block/commonMark/listItem";
import TaskListItem from "@muya/block/gfm/taskListItem";
import { BLOCK_DOM_PROPERTY, CLASS_NAMES } from "@muya/config";
import Muya from "@muya/index";
import type { ImageToken } from "@muya/inlineRenderer/types";
import { isElement, isKeyboardEvent, isMouseEvent } from "@muya/utils";
import { getImageInfo } from "@muya/utils/image";
import {
  compareParagraphsOrder,
  findContentDOM,
  getNodeAndOffset,
  getOffsetOfParagraph,
} from "./dom";
import { Cursor, NodeOffset, TSelection } from "./types";

class Selection {
  /**
   * topOffset is the line counts above cursor, and bottomOffset is line counts bellow cursor.
   * @param {*} paragraph
   */
  static getCursorYOffset(paragraph: HTMLElement) {
    const { y } = this.getCursorCoords()!;
    const { height, top } = paragraph.getBoundingClientRect();
    const lineHeight = parseFloat(getComputedStyle(paragraph).lineHeight);
    const topOffset = Math.floor((y - top) / lineHeight);
    const bottomOffset = Math.round(
      (top + height - lineHeight - y) / lineHeight
    );

    return {
      topOffset,
      bottomOffset,
    };
  }

  static getCursorCoords() {
    const sel = document.getSelection();
    let range;
    let rect = null;

    if (sel?.rangeCount) {
      range = sel.getRangeAt(0).cloneRange();
      if (range.getClientRects) {
        // range.collapse(true)
        let rects: DOMRectList | null = range.getClientRects();
        if (rects.length === 0) {
          rects =
            range.startContainer && isElement(range.startContainer)
              ? range.startContainer.getClientRects()
              : null;
        }

        if (rects?.length) {
          rect = rects[0];
        }
      }
    }

    return rect;
  }

  // https://stackoverflow.com/questions/1197401/
  // how-can-i-get-the-element-the-caret-is-in-with-javascript-when-using-contenteditable
  // by You
  static getSelectionStart() {
    const node = document.getSelection()!.anchorNode;
    const startNode =
      node && node.nodeType === Node.TEXT_NODE ? node.parentNode : node;

    return startNode;
  }

  get scrollPage() {
    return this.muya.editor.scrollPage;
  }

  get isCollapsed() {
    const { anchorBlock, focusBlock, anchor, focus } = this;

    if (anchor === null || focus === null) {
      return false;
    }

    return anchorBlock === focusBlock && anchor.offset === focus.offset;
  }

  get isSelectionInSameBlock() {
    const { anchorBlock, focusBlock, anchor } = this;

    if (anchor === null || focus === null) {
      return false;
    }

    return anchorBlock === focusBlock;
  }

  get direction() {
    const {
      anchor,
      focus,
      anchorBlock,
      focusBlock,
      isSelectionInSameBlock,
      isCollapsed,
    } = this;
    if (anchor === null || focus === null || !anchorBlock || !focusBlock) {
      return "none";
    }

    if (isCollapsed) {
      return "none";
    }

    if (isSelectionInSameBlock) {
      return anchor.offset < focus.offset ? "forward" : "backward";
    } else {
      const aDom = anchorBlock.domNode!;
      const fDom = focusBlock.domNode!;
      const order = compareParagraphsOrder(aDom, fDom);

      return order ? "forward" : "backward";
    }
  }

  get type() {
    const { anchorBlock, focusBlock, isCollapsed } = this;
    if (!anchorBlock && !focusBlock) {
      return "None";
    }

    return isCollapsed ? "Caret" : "Range";
  }

  public doc: Document = document;
  public anchorPath: Array<string | number> = [];
  public anchorBlock: ContentBlock | null = null;
  public focusPath: Array<string | number> = [];
  public focusBlock: ContentBlock | null = null;
  public anchor: NodeOffset | null = null;
  public focus: NodeOffset | null = null;
  public selectedImage: {
    token: ImageToken;
    imageId: string;
    block: Format;
  } | null = null;
  private selectInfo: {
    isSelect: boolean;
    selection: Cursor | null;
  } = {
    isSelect: false,
    selection: null,
  };

  constructor(public muya: Muya) {
    this.listenSelectActions();
  }

  private listenSelectActions() {
    const { eventCenter, domNode } = this.muya;

    const handleMousedown = () => {
      this.selectInfo = {
        isSelect: true,
        selection: null,
      };
    };

    const handleMouseupOrLeave = () => {
      if (this.selectInfo.selection) {
        this.setSelection(this.selectInfo.selection);
      }
      this.selectInfo = {
        isSelect: false,
        selection: null,
      };
    };

    const handleMousemoveOrClick = (event: Event) => {
      if (!isMouseEvent(event)) {
        return;
      }
      const { type, shiftKey } = event;
      if (type === "mousemove" && !this.selectInfo.isSelect) {
        return;
      }
      if (type === "click" && !shiftKey) {
        return;
      }
      const selection = this.getSelection();
      // The cursor is not in editor
      if (!selection) {
        return;
      }
      const {
        anchor,
        focus,
        anchorBlock,
        focusBlock,
        isSelectionInSameBlock,
        direction,
      } = selection;

      if (isSelectionInSameBlock) {
        // No need to handle this case
        return;
      }

      const newSelection = {
        anchor,
        focus,
        anchorBlock,
        focusBlock,
        anchorPath: anchorBlock.path,
        focusPath: focusBlock.path,
      };

      const anchorOutMostBlock = anchorBlock.outMostBlock as Parent;
      const focusOutMostBlock = focusBlock.outMostBlock as Parent;
      if (
        /block-quote|code-block|html-block|table|math-block|frontmatter|diagram/.test(
          anchorOutMostBlock!.blockName
        )
      ) {
        const firstContent = anchorOutMostBlock.firstContentInDescendant();
        const lastContent = anchorOutMostBlock.lastContentInDescendant();
        if (direction === "forward") {
          newSelection.anchorBlock = firstContent;
          newSelection.anchorPath = firstContent.path;
          newSelection.anchor.offset = 0;
        } else {
          newSelection.anchorBlock = lastContent;
          newSelection.anchorPath = lastContent.path;
          newSelection.anchor.offset = lastContent.text.length;
        }
      }

      if (
        /block-quote|code-block|html-block|table|math-block|frontmatter|diagram/.test(
          focusOutMostBlock.blockName
        )
      ) {
        const firstContent = focusOutMostBlock.firstContentInDescendant();
        const lastContent = focusOutMostBlock.lastContentInDescendant();
        if (direction === "forward") {
          newSelection.focusBlock = lastContent;
          newSelection.focusPath = lastContent.path;
          newSelection.focus.offset = lastContent.text.length;
        } else {
          newSelection.focusBlock = firstContent;
          newSelection.focusPath = firstContent.path;
          newSelection.focus.offset = 0;
        }
      }

      if (
        /bullet-list|order-list|task-list/.test(anchorOutMostBlock.blockName)
      ) {
        const listItemBlockName =
          anchorOutMostBlock.blockName === "task-list"
            ? "task-list-item"
            : "list-item";
        const listItem = anchorBlock.farthestBlock(listItemBlockName) as
          | ListItem
          | TaskListItem;
        const firstContent = listItem.firstContentInDescendant();
        const lastContent = listItem.lastContentInDescendant();
        if (direction === "forward") {
          newSelection.anchorBlock = firstContent;
          newSelection.anchorPath = firstContent.path;
          newSelection.anchor.offset = 0;
        } else {
          newSelection.anchorBlock = lastContent;
          newSelection.anchorPath = lastContent.path;
          newSelection.anchor.offset = lastContent.text.length;
        }
      }

      if (
        /bullet-list|order-list|task-list/.test(focusOutMostBlock.blockName)
      ) {
        const listItemBlockName =
          focusOutMostBlock.blockName === "task-list"
            ? "task-list-item"
            : "list-item";
        const listItem = focusBlock.farthestBlock(listItemBlockName) as
          | ListItem
          | TaskListItem;
        const firstContent = listItem.firstContentInDescendant();
        const lastContent = listItem.lastContentInDescendant();
        if (direction === "forward") {
          newSelection.focusBlock = lastContent;
          newSelection.focusPath = lastContent.path;
          newSelection.focus.offset = lastContent.text.length;
        } else {
          newSelection.focusBlock = firstContent;
          newSelection.focusPath = firstContent.path;
          newSelection.focus.offset = 0;
        }
      }

      if (type === "mousemove") {
        this.selectInfo.selection = newSelection;
      } else {
        this.setSelection(newSelection);
      }
    };

    const docHandlerClick = () => {
      this.selectedImage = null;
    };

    const handleClick = (event: Event) => {
      const { target } = event;
      const imageWrapper = (target as HTMLElement)?.closest(
        `.${CLASS_NAMES.MU_INLINE_IMAGE}`
      );
      this.selectedImage = null;
      if (imageWrapper) {
        return this.handleClickInlineImage(event, imageWrapper as HTMLElement);
      }
    };

    const handleKeydown = (event: Event) => {
      if (!isKeyboardEvent(event)) {
        return;
      }
      const { key } = event;
      const { selectedImage } = this;
      if (selectedImage && /Backspace|Enter/.test(key)) {
        event.preventDefault();
        const { block, ...imageInfo } = selectedImage;
        block.deleteImage(imageInfo);
        this.selectedImage = null;
      }
    };

    eventCenter.attachDOMEvent(domNode, "mousedown", handleMousedown);
    eventCenter.attachDOMEvent(domNode, "mousemove", handleMousemoveOrClick);
    eventCenter.attachDOMEvent(domNode, "mouseup", handleMouseupOrLeave);
    eventCenter.attachDOMEvent(domNode, "mouseleave", handleMouseupOrLeave);
    eventCenter.attachDOMEvent(domNode, "click", handleMousemoveOrClick);
    eventCenter.attachDOMEvent(domNode, "click", handleClick);
    eventCenter.attachDOMEvent(document, "click", docHandlerClick);
    eventCenter.attachDOMEvent(document, "keydown", handleKeydown);
  }

  // Handle click inline image.
  private handleClickInlineImage(event: Event, imageWrapper: HTMLElement) {
    event.preventDefault();
    event.stopPropagation();
    const { eventCenter } = this.muya;
    const imageInfo = getImageInfo(imageWrapper);
    const { target } = event;
    const deleteContainer = (target as HTMLElement).closest(
      ".mu-image-icon-close"
    );
    const contentDom = findContentDOM(target as Node);

    if (!contentDom) {
      return;
    }

    const contentBlock = contentDom[BLOCK_DOM_PROPERTY] as Format;

    if (deleteContainer) {
      contentBlock.deleteImage(imageInfo);

      return;
    }

    // Handle image click, to select the current image
    if ((target as HTMLElement)?.tagName === "IMG") {
      // Handle show image toolbar
      const rect = imageWrapper
        .querySelector(`.${CLASS_NAMES.MU_IMAGE_CONTAINER}`)
        ?.getBoundingClientRect();
      const reference = {
        getBoundingClientRect: () => rect,
        width: imageWrapper.offsetWidth,
        height: imageWrapper.offsetHeight,
      };

      // Show image edit tool bar.
      eventCenter.emit("muya-image-toolbar", {
        block: contentBlock,
        reference,
        imageInfo,
      });

      // Handle show image transformer.
      const imageSelector = `#${imageInfo.imageId}`;

      const imageContainer = document.querySelector(
        `${imageSelector} .${CLASS_NAMES.MU_IMAGE_CONTAINER}`
      );

      eventCenter.emit("muya-transformer", {
        block: contentBlock,
        reference: imageContainer,
        imageInfo,
      });

      this.selectedImage = Object.assign({}, imageInfo, {
        block: contentBlock,
      });
      this.muya.editor.activeContentBlock = null;
      this.setSelection({
        anchor: null,
        focus: null,
      });

      return;
    }

    // Handle click imageWrapper when it's empty or image load failed.
    if (
      imageWrapper.classList.contains(CLASS_NAMES.MU_EMPTY_IMAGE) ||
      imageWrapper.classList.contains(CLASS_NAMES.MU_IMAGE_FAIL)
    ) {
      const rect = imageWrapper.getBoundingClientRect();
      const reference = {
        getBoundingClientRect: () => rect,
        width: imageWrapper.offsetWidth,
        height: imageWrapper.offsetHeight,
      };
      const imageInfo = getImageInfo(imageWrapper);
      eventCenter.emit("muya-image-selector", {
        block: contentBlock,
        reference,
        imageInfo,
      });
    }
  }

  selectAll() {
    const {
      anchor,
      focus,
      isSelectionInSameBlock,
      anchorBlock,
      anchorPath,
      scrollPage,
    } = this;
    // Select all in one content block.
    // Can use getSelection here?
    if (
      isSelectionInSameBlock &&
      anchor &&
      focus &&
      anchorBlock &&
      Math.abs(focus.offset - anchor.offset) < anchorBlock.text.length
    ) {
      const cursor: Cursor = {
        anchor: { offset: 0 },
        focus: { offset: anchorBlock.text.length },
        block: anchorBlock,
        path: anchorPath,
      };

      this.setSelection(cursor);
      return;
    }
    // Select all content in all blocks.
    const aBlock: Content = scrollPage.firstContentInDescendant();
    const fBlock: Content = scrollPage.lastContentInDescendant();

    const cursor: Cursor = {
      anchor: { offset: 0 },
      focus: { offset: fBlock.text.length },
      anchorBlock: aBlock,
      anchorPath: aBlock.path,
      focusBlock: fBlock,
      focusPath: fBlock.path,
    };

    this.setSelection(cursor);
    const activeEle = this.doc.activeElement;
    if (activeEle && activeEle.classList.contains("mu-content")) {
      (activeEle as HTMLElement).blur();
    }
  }

  /**
   * Return the current selection of doc or null if has no selection.
   * @returns
   */
  getSelection(): TSelection | null {
    const selection = document.getSelection();

    if (!selection) {
      return null;
    }

    const { anchorNode, anchorOffset, focusNode, focusOffset } = selection;

    if (!anchorNode || !focusNode) {
      return null;
    }

    const anchorDomNode = findContentDOM(anchorNode);
    const focusDomNode = findContentDOM(focusNode);

    if (!anchorDomNode || !focusDomNode) {
      return null;
    }

    const anchorBlock = anchorDomNode[BLOCK_DOM_PROPERTY] as ContentBlock;
    const focusBlock = focusDomNode[BLOCK_DOM_PROPERTY] as ContentBlock;
    const anchorPath = anchorBlock.path;
    const focusPath = focusBlock.path;

    const aOffset =
      getOffsetOfParagraph(anchorNode, anchorDomNode) + anchorOffset;
    const fOffset = getOffsetOfParagraph(focusNode, focusDomNode) + focusOffset;
    const anchor = { offset: aOffset };
    const focus = { offset: fOffset };

    const isCollapsed =
      anchorBlock === focusBlock && anchor.offset === focus.offset;

    const isSelectionInSameBlock = anchorBlock === focusBlock;
    let direction = "none";
    let type = "None";

    if (isCollapsed) {
      direction = "none";
    }
    if (isSelectionInSameBlock) {
      direction = anchor.offset < focus.offset ? "forward" : "backward";
    } else {
      const aDom = anchorBlock.domNode!;
      const fDom = focusBlock.domNode!;
      const order = compareParagraphsOrder(aDom, fDom);
      direction = order ? "forward" : "backward";
    }

    type = isCollapsed ? "Caret" : "Range";

    return {
      anchor,
      focus,
      anchorBlock,
      anchorPath,
      focusBlock,
      focusPath,
      isCollapsed,
      isSelectionInSameBlock,
      direction,
      type,
    };
  }

  setSelection({
    anchor,
    focus,
    block,
    path,
    anchorBlock,
    anchorPath,
    focusBlock,
    focusPath,
  }: Cursor) {
    this.anchor = anchor ?? null;
    this.focus = focus ?? null;
    this.anchorBlock = anchorBlock ?? block ?? null;
    this.anchorPath = anchorPath ?? path ?? [];
    this.focusBlock = focusBlock ?? block ?? null;
    this.focusPath = focusPath ?? path ?? [];
    // Update cursor.
    this.setCursor();

    const {
      isCollapsed,
      isSelectionInSameBlock,
      direction,
      type,
      selectedImage,
    } = this;

    this.muya.eventCenter.emit("selection-change", {
      anchor,
      focus,
      anchorBlock,
      anchorPath,
      focusBlock,
      focusPath,
      isCollapsed,
      isSelectionInSameBlock,
      direction,
      type,
      selectedImage,
    });
  }

  private selectRange(range: Range) {
    const selection = this.doc.getSelection();

    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  private select(
    startNode: Node,
    startOffset: number,
    endNode?: Node,
    endOffset?: number
  ) {
    const range = this.doc.createRange();
    range.setStart(startNode, startOffset);
    if (endNode && typeof endOffset === "number") {
      range.setEnd(endNode, endOffset);
    } else {
      range.collapse(true);
    }
    this.selectRange(range);

    return range;
  }

  private setFocus(focusNode: Node, focusOffset: number) {
    const selection = this.doc.getSelection();
    if (selection) {
      selection.extend(focusNode, focusOffset);
    }
  }

  private setCursor() {
    const {
      anchor,
      focus,
      anchorBlock,
      anchorPath,
      focusBlock,
      focusPath,
      scrollPage,
    } = this;

    // Remove the selection when type is `None`.
    if (!anchor || !focus) {
      const selection = this.doc.getSelection();
      if (selection) {
        selection.removeAllRanges();
      }
      return;
    }

    const anchorParagraph = anchorBlock
      ? anchorBlock.domNode
      : scrollPage.queryBlock(anchorPath);
    const focusParagraph = focusBlock
      ? focusBlock.domNode
      : scrollPage.queryBlock(focusPath);

    const { node: anchorNode, offset: anchorOffset } = getNodeAndOffset(
      anchorParagraph,
      anchor.offset
    );
    const { node: focusNode, offset: focusOffset } = getNodeAndOffset(
      focusParagraph,
      focus.offset
    );

    // First set the anchor node and anchor offset, make it collapsed
    this.select(anchorNode, anchorOffset);
    // Secondly, set the focus node and focus offset.
    this.setFocus(focusNode, focusOffset);
  }
}

export default Selection;
