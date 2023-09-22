import Popper from "popper.js";
import { noop } from "@muya/utils";
import { EVENT_KEYS } from "@muya/config";
import Muya from "@muya/index";

import "./index.css";

export interface IBaseFloatOptions {
  photoCreatorClick?: any;
  placement: string;
  modifiers: {
    offset: {
      offset: string;
    };
  };
  showArrow: boolean;
}

const defaultOptions = () => ({
  placement: "bottom-start",
  modifiers: {
    offset: {
      offset: "0, 12",
    },
  },
  showArrow: true,
});

const BUTTON_GROUP = ["mu-table-drag-bar", "mu-front-button"];

class BaseFloat {
  public options: IBaseFloatOptions;
  public status: boolean = false;
  public floatBox: HTMLElement | null = null;
  public container: HTMLElement | null = null;
  public popper: Popper | null = null;
  public lastScrollTop: number | null = null;
  public cb: (...args: Array<any>) => void = noop;
  private resizeObserver: ResizeObserver | null = null;

  constructor(public muya: Muya, public name: string, options = {}) {
    this.options = Object.assign({}, defaultOptions(), options);
    this.init();
  }

  init() {
    const { showArrow } = this.options;
    const floatBox = document.createElement("div");
    const container = document.createElement("div");
    // Use to remember which float container is shown.
    container.classList.add(this.name);
    container.classList.add("mu-float-container");
    floatBox.classList.add("mu-float-wrapper");

    if (showArrow) {
      const arrow = document.createElement("div");
      arrow.setAttribute("x-arrow", "");
      arrow.classList.add("mu-popper-arrow");
      floatBox.appendChild(arrow);
    }

    floatBox.appendChild(container);
    document.body.appendChild(floatBox);

    const resizeObserver = this.resizeObserver = new ResizeObserver(() => {
      const { offsetWidth, offsetHeight } = container;

      Object.assign(floatBox.style, {
        width: `${offsetWidth}px`,
        height: `${offsetHeight}px`,
      });

      this.popper && this.popper.update();
    });

    resizeObserver.observe(container);

    this.floatBox = floatBox;
    this.container = container;
  }

  listen() {
    const { eventCenter, domNode } = this.muya;
    const { floatBox } = this;
    const keydownHandler = (event) => {
      if (event.key === EVENT_KEYS.Escape) {
        this.hide();
      }
    };

    const scrollHandler = (event) => {
      if (typeof this.lastScrollTop !== "number") {
        this.lastScrollTop = event.target.scrollTop;

        return;
      }

      // only when scroll distance great than 50px, then hide the float box.
      if (
        this.status &&
        Math.abs(event.target.scrollTop - this.lastScrollTop) > 50
      ) {
        this.hide();
      }
    };

    eventCenter.attachDOMEvent(document, "click", this.hide.bind(this));
    eventCenter.attachDOMEvent(floatBox, "click", (event) => {
      event.stopPropagation();
      event.preventDefault();
    });
    eventCenter.attachDOMEvent(domNode, "keydown", keydownHandler);
    eventCenter.attachDOMEvent(domNode, "scroll", scrollHandler);
  }

  hide() {
    const { eventCenter } = this.muya;
    if (!this.status) return;
    this.status = false;
    if (this.popper && this.popper.destroy) {
      this.popper.destroy();
    }
    this.cb = noop;
    this.lastScrollTop = null;
    if (BUTTON_GROUP.includes(this.name)) {
      eventCenter.emit("muya-float-button", this, false);
    } else {
      eventCenter.emit("muya-float", this, false);
    }
  }

  show(reference, cb = noop) {
    const { floatBox } = this;
    const { eventCenter } = this.muya;
    const { placement, modifiers } = this.options;
    if (this.popper && this.popper.destroy) {
      this.popper.destroy();
    }
    this.cb = cb;
    this.popper = new Popper(reference, floatBox, {
      placement,
      modifiers,
    });
    this.status = true;
    if (BUTTON_GROUP.includes(this.name)) {
      eventCenter.emit("muya-float-button", this, true);
    } else {
      eventCenter.emit("muya-float", this, true);
    }
  }

  destroy() {
    if (this.container && this.resizeObserver) {
      this.resizeObserver.unobserve(this.container);
    }

    if (this.popper && this.popper.destroy) {
      this.popper.destroy();
    }
    this.floatBox?.remove();
  }
}

export default BaseFloat;
