import Popper from "popper.js/dist/esm/popper";
import resizeDetector from "element-resize-detector";
import { throttle, verticalPositionInRect } from "@muya/utils";
import { patch, h } from "@muya/utils/snabbdom";
import { BLOCK_DOM_PROPERTY } from "@muya/config";
import { getIcon } from "./config";
import dragIcon from "@muya/assets/icons/drag/2.png";
import Muya from "../../index";

import "./index.css";

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

const renderIcon = (i, className) =>
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
  public name: string;
  private options: { placement: string; modifiers: { offset: { offset: string; }; }; showArrow: boolean; };
  public muya: Muya;
  private block: any;
  private oldVnode: any;
  private status: boolean;
  private floatBox: HTMLDivElement;
  private container: HTMLDivElement;
  private iconWrapper: HTMLDivElement;
  private popper: any;
  private dragTimer: any;
  private dragInfo: any;
  private ghost: HTMLDivElement;
  private shadow: HTMLDivElement;
  private disableListen: boolean;
  private dragEvents: any[];

  constructor(muya, options = {}) {
    this.name = "mu-front-button";
    this.options = Object.assign({}, defaultOptions(), options);
    this.muya = muya;
    this.block = null;
    this.oldVnode = null;
    this.status = false;
    this.floatBox = null;
    this.container = null;
    this.iconWrapper = null;
    this.popper = null;
    this.dragTimer = null;
    this.dragInfo = null;
    this.ghost = null;
    this.shadow = null;
    this.disableListen = false;
    this.dragEvents = [];
    this.init();
    this.listen();
  }

  init() {
    const floatBox = document.createElement("div");
    const container = document.createElement("div");
    const iconWrapper = document.createElement("div");
    // Use to remember which float container is shown.
    container.classList.add(this.name);
    container.appendChild(iconWrapper);
    floatBox.classList.add("mu-front-button-wrapper");
    floatBox.appendChild(container);
    const erd = resizeDetector({
      strategy: "scroll",
    });

    // use polyfill
    erd.listenTo(container, (ele) => {
      const { offsetWidth, offsetHeight } = ele;
      Object.assign(floatBox.style, {
        width: `${offsetWidth}px`,
        height: `${offsetHeight}px`,
      });
      this.popper && this.popper.update();
    });
    document.body.appendChild(floatBox);

    this.floatBox = floatBox;
    this.container = container;
    this.iconWrapper = iconWrapper;
  }

  listen() {
    const { container } = this;
    const { eventCenter } = this.muya;
    const mousemoveHandler = throttle((event) => {
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
          ele[BLOCK_DOM_PROPERTY] && ele[BLOCK_DOM_PROPERTY].isOutMostBlock
      );
      if (outMostElement) {
        this.show(outMostElement[BLOCK_DOM_PROPERTY]);
        this.render();
      } else {
        this.hide();
      }
    }, 300);

    const clickHandler = (event) => {
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

  dragBarMouseDown = (event) => {
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

  mouseMove = (event) => {
    if (!this.dragInfo) {
      return;
    }
    event.preventDefault();

    const { x, y } = event;
    const eles = [
      ...document.elementsFromPoint(x, y),
      ...document.elementsFromPoint(x + LEFT_OFFSET, y),
    ];
    const outMostElement = eles.find(
      (ele) => ele[BLOCK_DOM_PROPERTY] && ele[BLOCK_DOM_PROPERTY].isOutMostBlock
    );
    this.moveShadow(event);

    if (
      outMostElement &&
      outMostElement[BLOCK_DOM_PROPERTY] !== this.dragInfo.block &&
      outMostElement[BLOCK_DOM_PROPERTY].blockName !== "frontmatter"
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

  mouseUp = (event) => {
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
    const { block, target, position } = this.dragInfo;

    if (target && position) {
      if (
        (position === "down" && block.prev === target) ||
        (position === "up" && block.next === target)
      ) {
        return;
      }

      if (position === "up") {
        block.insertInto(block.parent, target);
      } else {
        block.insertInto(block.parent, target.next);
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

  startDrag = (event) => {
    const { block } = this;
    // Frontmatter shoud not be drag.
    if (block.blockName === "frontmatter") {
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
    const { container, iconWrapper, block, oldVnode } = this;

    const iconWrapperSelector = "div.mu-icon-wrapper";
    const i = getIcon(block);
    const iconParagraph = renderIcon(i, "paragraph");
    const iconDrag = renderIcon(dragIcon, "drag");

    const vnode = h(iconWrapperSelector, [iconParagraph, iconDrag]);

    if (oldVnode) {
      patch(oldVnode, vnode);
    } else {
      patch(iconWrapper, vnode);
    }
    this.oldVnode = vnode;

    // Reset float box style height
    const { lineHeight } = getComputedStyle(block.domNode);
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
    this.floatBox.style.opacity = '0';
    eventCenter.emit("muya-float-button", this, false);
  }

  show(block) {
    if (this.block && this.block === block) {
      return;
    }
    this.block = block;
    const { domNode } = block;
    const { floatBox } = this;
    const { placement, modifiers } = this.options;
    const { eventCenter } = this.muya;
    floatBox.style.opacity = '1';
    if (this.popper && this.popper.destroy) {
      this.popper.destroy();
    }

    const styles = window.getComputedStyle(domNode);
    const paddingTop = parseFloat(styles["padding-top"]);
    const isLooseList = /^(?:ul|ol)$/.test(block.tagName) && block.meta.loose;
    modifiers.offset.offset = `${isLooseList ? paddingTop * 2 : paddingTop}, 8`;

    this.popper = new Popper(domNode, floatBox, {
      placement,
      modifiers,
    });
    this.status = true;
    eventCenter.emit("muya-float-button", this, true);
  }

  destroy() {
    if (this.popper && this.popper.destroy) {
      this.popper.destroy();
    }

    this.floatBox.remove();
  }
}

export default FrontButton;
