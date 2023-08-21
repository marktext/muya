import Popper from "popper.js/dist/esm/popper";
import resizeDetector from "element-resize-detector";
import { noop } from "@/utils";
import { EVENT_KEYS } from "@/config";
import Muya from "../../index";

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
  public name: string;
  public muya: Muya;
  public options: IBaseFloatOptions;
  public status: boolean;
  public floatBox: HTMLElement | null;
  public container: HTMLElement | null;
  public popper: any;
  public lastScrollTop: number | null;
  public cb: (...args: Array<any>) => void;

  constructor(muya, name, options = {}) {
    this.name = name;
    this.muya = muya;
    this.options = Object.assign({}, defaultOptions(), options);
    this.status = false;
    this.floatBox = null;
    this.container = null;
    this.popper = null;
    this.lastScrollTop = null;
    this.cb = noop;
    this.init();
  }

  init() {
    const { showArrow } = this.options;
    const floatBox = document.createElement("div");
    const container = document.createElement("div");
    // Use to remember whick float container is shown.
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

      // only when scoll distance great than 50px, then hide the float box.
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
    if (this.popper && this.popper.destroy) {
      this.popper.destroy();
    }
    this.floatBox.remove();
  }
}

export default BaseFloat;
