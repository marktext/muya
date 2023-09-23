import Popper from "popper.js";
import { throttle, verticalPositionInRect, isMouseEvent } from "@muya/utils";
import { patch, h } from "@muya/utils/snabbdom";
import { BLOCK_DOM_PROPERTY } from "@muya/config";
import { getIcon } from "./config";
import Muya from "@muya/index";

import "./index.css";
import dragIcon from "@muya/assets/icons/drag/2.png";
import type { VNode } from "snabbdom";
import type Parent from "@muya/block/base/parent";
import type { Placement } from "popper.js";

const LEFT_OFFSET = 100;

const defaultOptions = () => ({
  placement: "left-start",
  modifiers: {
    offset: {
      offset: "0, 8",
    },
  },
  showArrow: false,
});

const renderIcon = (i: string, className: string) =>
  h(
    `i.icon${className ? `.${className}` : ""}`,
    h(
      "i.icon-inner",
      {
        style: {
          background: `url(${i}) no-repeat`,
          "background-size": "100%",
        },
      },
      ""
    )
  );

class FrontButton {
  public name: string = "mu-front-button";
  public resizeObserver: ResizeObserver | null = null;
  private options: {
    placement: Placement;
    modifiers: { offset: { offset: string } };
    showArrow: boolean;
  };
  private block: Parent | null = null;
  private oldVNode: VNode | null = null;
  private status: boolean = false;
  private floatBox: HTMLDivElement = document.createElement("div");
  private container: HTMLDivElement = document.createElement("div");
  private iconWrapper: HTMLDivElement = document.createElement("div");
  private popper: Popper | null = null;
  private dragTimer: string | number | Timeout | null = null;
  private dragInfo: {
    block: Parent;
    target: Parent | null;
    position: "down" | "up" | null;
  } | null = null;
  private ghost: HTMLDivElement | null = null;
  private shadow: HTMLDivElement | null = null;
  private disableListen: boolean = false;
  private dragEvents: string[] = [];

  constructor(public muya: Muya, options = {}) {
    this.options = Object.assign({}, defaultOptions(), options);
    this.init();
    this.listen();
  }

  init() {
    const { floatBox, container, iconWrapper } = this;
    // Use to remember which float container is shown.
    container.classList.add(this.name);
    container.appendChild(iconWrapper);
    floatBox.classList.add("mu-front-button-wrapper");
    floatBox.appendChild(container);
    document.body.appendChild(floatBox);

    // Since the size of the container is not fixed and changes according to the change of content,
    // the floatBox needs to set the size according to the container size
    const resizeObserver = (this.resizeObserver = new ResizeObserver(() => {
      const { offsetWidth, offsetHeight } = container;

      Object.assign(floatBox.style, {
        width: `${offsetWidth}px`,
        height: `${offsetHeight}px`,
      });

      this.popper && this.popper.update();
    }));

    resizeObserver.observe(container);
  }

  listen() {
    const { container } = this;
    const { eventCenter } = this.muya;

    const mousemoveHandler = throttle((event: MouseEvent) => {
      if (this.disableListen) {
        return;
      }
      const { x, y } = event;
      const eles = [
        ...document.elementsFromPoint(x, y),
        ...document.elementsFromPoint(x + LEFT_OFFSET, y),
      ];
      const outMostElement = eles.find(
        (ele) =>
          ele[BLOCK_DOM_PROPERTY] &&
          (ele[BLOCK_DOM_PROPERTY] as Parent).isOutMostBlock
      );
      if (outMostElement) {
        this.show(outMostElement[BLOCK_DOM_PROPERTY] as Parent);
        this.render();
      } else {
        this.hide();
      }
    }, 300);

    const clickHandler = () => {
      eventCenter.emit("muya-front-menu", {
        reference: container,
        block: this.block,
      });
    };

    eventCenter.attachDOMEvent(container, "mousedown", this.dragBarMouseDown);
    eventCenter.attachDOMEvent(container, "mouseup", this.dragBarMouseUp);
    eventCenter.attachDOMEvent(document, "mousemove", mousemoveHandler);
    eventCenter.attachDOMEvent(container, "click", clickHandler);
  }

  dragBarMouseDown = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    this.dragTimer = setTimeout(() => {
      this.startDrag(event);
      this.dragTimer = null;
    }, 300);
  };

  dragBarMouseUp = () => {
    if (this.dragTimer) {
      clearTimeout(this.dragTimer);
      this.dragTimer = null;
    }
  };

  mouseMove = (event: Event) => {
    if (!this.dragInfo || !isMouseEvent(event)) {
      return;
    }

    event.preventDefault();

    const { x, y } = event;
    const eles = [
      ...document.elementsFromPoint(x, y),
      ...document.elementsFromPoint(x + LEFT_OFFSET, y),
    ];
    const outMostElement = eles.find(
      (ele) =>
        ele[BLOCK_DOM_PROPERTY] &&
        (ele[BLOCK_DOM_PROPERTY] as Parent).isOutMostBlock
    );
    this.moveShadow(event);

    if (
      outMostElement &&
      outMostElement[BLOCK_DOM_PROPERTY] !== this.dragInfo.block &&
      (outMostElement[BLOCK_DOM_PROPERTY] as Parent).blockName !== "frontmatter"
    ) {
      const block = outMostElement[BLOCK_DOM_PROPERTY];
      const rect = outMostElement.getBoundingClientRect();
      const position = verticalPositionInRect(event, rect);
      this.createStyledGhost(rect, position);

      Object.assign(this.dragInfo, {
        target: block,
        position,
      });
    } else {
      if (this.ghost) {
        this.ghost.remove();
        this.ghost = null;
        this.dragInfo.target = null;
        this.dragInfo.position = null;
      }
    }
  };

  mouseUp = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    this.disableListen = false;
    const { eventCenter } = this.muya;
    this.dragEvents.forEach((eventId) => eventCenter.detachDOMEvent(eventId));
    this.dragEvents = [];
    if (this.ghost) {
      this.ghost.remove();
    }
    this.destroyShadow();
    document.body.style.cursor = "auto";
    this.dragTimer = null;
    const { block, target, position } = this.dragInfo || {};

    if (target && position && block) {
      if (
        (position === "down" && block.prev === target) ||
        (position === "up" && block.next === target)
      ) {
        return;
      }

      if (position === "up") {
        block.insertInto(block.parent!, target);
      } else {
        block.insertInto(block.parent!, target.next);
      }

      const { anchorBlock, anchor, focus, isSelectionInSameBlock } =
        block.muya.editor.selection ?? {};

      if (
        isSelectionInSameBlock &&
        anchorBlock &&
        anchorBlock.isInBlock(block)
      ) {
        const begin = Math.min(anchor.offset, focus.offset);
        const end = Math.max(anchor.offset, focus.offset);
        anchorBlock.setCursor(begin, end);
      }
    }

    this.dragInfo = null;
  };

  startDrag = () => {
    const { block } = this;
    // Frontmatter should not be drag.
    if (block && block.blockName === "frontmatter") {
      return;
    }
    this.disableListen = true;
    this.dragInfo = {
      block,
    };
    this.createStyledShadow();
    this.hide();
    const { eventCenter } = this.muya;

    document.body.style.cursor = "grabbing";

    this.dragEvents = [
      eventCenter.attachDOMEvent(
        document,
        "mousemove",
        throttle(this.mouseMove, 100)
      ),
      eventCenter.attachDOMEvent(document, "mouseup", this.mouseUp),
    ];
  };

  createStyledGhost(rect, position) {
    let ghost = this.ghost;
    if (!ghost) {
      ghost = document.createElement("div");
      document.body.appendChild(ghost);
      ghost.classList.add("mu-line-ghost");
      this.ghost = ghost;
    }

    Object.assign(ghost.style, {
      width: `${rect.width}px`,
      left: `${rect.left}px`,
      top: position === "up" ? `${rect.top}px` : `${rect.top + rect.height}px`,
    });
  }

  createStyledShadow() {
    const { domNode } = this.block;
    const { width, top, left } = domNode.getBoundingClientRect();
    const shadow = document.createElement("div");
    shadow.classList.add("mu-shadow");
    Object.assign(shadow.style, {
      width: `${width}px`,
      top: `${top}px`,
      left: `${left}px`,
    });
    shadow.appendChild(domNode.cloneNode(true));
    document.body.appendChild(shadow);
    this.shadow = shadow;
  }

  moveShadow(event) {
    const { shadow } = this;
    // The shadow already be removed.
    if (!shadow) {
      return;
    }
    const { y } = event;
    Object.assign(shadow.style, {
      top: `${y}px`,
    });
  }

  destroyShadow() {
    const { shadow } = this;
    if (shadow) {
      shadow.remove();
      this.shadow = null;
    }
  }

  render() {
    const { container, iconWrapper, block, oldVNode } = this;

    const iconWrapperSelector = "div.mu-icon-wrapper";
    const i = getIcon(block);
    const iconParagraph = renderIcon(i, "paragraph");
    const iconDrag = renderIcon(dragIcon, "drag");

    const vnode = h(iconWrapperSelector, [iconParagraph, iconDrag]);

    if (oldVNode) {
      patch(oldVNode, vnode);
    } else {
      patch(iconWrapper, vnode);
    }
    this.oldVNode = vnode;

    // Reset float box style height
    const { lineHeight } = getComputedStyle(block!.domNode!);
    container.style.height = lineHeight;
  }

  hide() {
    if (!this.status) {
      return;
    }
    this.block = null;
    this.status = false;
    const { eventCenter } = this.muya;
    if (this.popper && this.popper.destroy) {
      this.popper.destroy();
    }
    this.floatBox.style.opacity = "0";
    eventCenter.emit("muya-float-button", this, false);
  }

  show(block: Parent) {
    if (this.block && this.block === block) {
      return;
    }
    this.block = block;
    const { domNode } = block;
    const { floatBox } = this;
    const { placement, modifiers } = this.options;
    const { eventCenter } = this.muya;
    floatBox.style.opacity = "1";
    if (this.popper && this.popper.destroy) {
      this.popper.destroy();
    }

    const styles = window.getComputedStyle(domNode!);
    const paddingTop = parseFloat(styles["padding-top"]);
    const isLooseList = /^(?:ul|ol)$/.test(block.tagName) && block.meta.loose;
    modifiers.offset.offset = `${isLooseList ? paddingTop * 2 : paddingTop}, 8`;

    this.popper = new Popper(domNode!, floatBox, {
      placement,
      modifiers,
    });
    this.status = true;
    eventCenter.emit("muya-float-button", this, true);
  }

  destroy() {
    if (this.container && this.resizeObserver) {
      this.resizeObserver.unobserve(this.container);
    }

    if (this.popper && this.popper.destroy) {
      this.popper.destroy();
    }

    this.floatBox.remove();
  }
}

export default FrontButton;
