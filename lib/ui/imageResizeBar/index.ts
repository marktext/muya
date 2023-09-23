import type Muya from "@muya/index";
import type Format from "@muya/block/base/format";
import type { ImageToken } from "@muya/inlineRenderer/types";

import "./index.css";
import { isMouseEvent } from "@muya/utils";

const VERTICAL_BAR = ["left", "right"];

const CIRCLE_RADIO = 5;
const BAR_HEIGHT = 50;

class ImageResizeBar {
  static pluginName = "transformer";
  private reference: HTMLElement | null = null;
  private block: Format | null = null;
  private imageInfo: {
    token: ImageToken;
    imageId: string;
  } | null = null;
  private movingAnchor: string | null = null;
  private status: boolean = false;
  private width: number | null = null;
  private eventId: string[] = [];
  private lastScrollTop: number | null = null;
  private resizing: boolean = false;
  // A container for storing drag strips
  private container: HTMLDivElement;

  constructor(public muya: Muya) {
    const container = (this.container = document.createElement("div"));
    container.classList.add("mu-transformer");
    document.body.appendChild(container);

    this.listen();
  }

  listen() {
    const { eventCenter, domNode } = this.muya;

    const scrollHandler = (event: Event) => {
      if (typeof this.lastScrollTop !== "number") {
        this.lastScrollTop = (event.target as HTMLElement).scrollTop;

        return;
      }

      // only when scroll distance great than 50px, then hide the float box.
      if (
        !this.resizing &&
        this.status &&
        Math.abs((event.target as HTMLElement).scrollTop - this.lastScrollTop) > 50
      ) {
        this.hide();
      }
    };

    eventCenter.on("muya-transformer", ({ block, reference, imageInfo }) => {
      this.reference = reference;
      if (reference) {
        this.block = block;
        this.imageInfo = imageInfo;
        setTimeout(() => {
          this.render();
        });
      } else {
        this.hide();
      }
    });

    eventCenter.attachDOMEvent(document, "click", this.hide.bind(this));
    eventCenter.attachDOMEvent(domNode.parentElement!, "scroll", scrollHandler);
    eventCenter.attachDOMEvent(this.container, "dragstart", (event) =>
      event.preventDefault()
    );
    eventCenter.attachDOMEvent(document.body, "mousedown", this.mouseDown);
  }

  render() {
    const { eventCenter } = this.muya;
    if (this.status) {
      this.hide();
    }
    this.status = true;

    this.createElements();
    this.update();
    eventCenter.emit("muya-float", this, true);
  }

  createElements() {
    VERTICAL_BAR.forEach((c) => {
      const bar = document.createElement("div");
      bar.classList.add("bar");
      bar.classList.add(c);
      bar.setAttribute("data-position", c);
      this.container.appendChild(bar);
    });
  }

  update() {
    const rect = this.reference!.getBoundingClientRect();
    VERTICAL_BAR.forEach((c) => {
      const bar: HTMLDivElement = this.container.querySelector(`.${c}`)!;

      switch (c) {
        case "left":
          bar.style.left = `${rect.left - CIRCLE_RADIO}px`;
          bar.style.top = `${rect.top + rect.height / 2 - BAR_HEIGHT / 2}px`;
          break;

        case "right":
          bar.style.left = `${rect.left + rect.width - CIRCLE_RADIO}px`;
          bar.style.top = `${rect.top + rect.height / 2 - BAR_HEIGHT / 2}px`;
          break;
      }
    });
  }

  mouseDown = (event: Event) => {
    const target = event.target as HTMLElement;
    if (!target.closest(".bar")) {
      return;
    }

    const { eventCenter } = this.muya;
    this.movingAnchor = target.getAttribute("data-position");
    const mouseMoveId = eventCenter.attachDOMEvent(
      document.body,
      "mousemove",
      this.mouseMove
    );
    const mouseUpId = eventCenter.attachDOMEvent(
      document.body,
      "mouseup",
      this.mouseUp
    );
    this.resizing = true;
    // Hide image toolbar
    eventCenter.emit("muya-image-toolbar", { reference: null });
    this.eventId.push(mouseMoveId, mouseUpId);
  };

  mouseMove = (event: Event) => {
    if (!isMouseEvent(event)) {
      return;
    }
    event.preventDefault();
    const { clientX } = event;
    let width: number | string = "";
    let relativeAnchor: HTMLDivElement;
    const image = this.reference!.querySelector("img");
    if (!image) {
      return;
    }

    switch (this.movingAnchor) {
      case "left":
        relativeAnchor = this.container.querySelector(".right")!;
        width = Math.max(
          relativeAnchor.getBoundingClientRect().left + CIRCLE_RADIO - clientX,
          50
        );
        break;

      case "right":
        relativeAnchor = this.container.querySelector(".left")!;
        width = Math.max(
          clientX - relativeAnchor.getBoundingClientRect().left - CIRCLE_RADIO,
          50
        );
        break;
    }
    // Image width/height attribute must be an integer.
    width = parseInt(String(width));
    this.width = width;
    image.setAttribute("width", String(width));
    this.update();
  };

  mouseUp = (event: Event) => {
    event.preventDefault();
    const { eventCenter } = this.muya;
    if (this.eventId.length) {
      for (const id of this.eventId) {
        eventCenter.detachDOMEvent(id);
      }
      this.eventId = [];
    }

    if (typeof this.width === "number" && this.block && this.imageInfo) {
      this.block.updateImage(this.imageInfo, "width", String(this.width));
      this.hide();
    }

    this.width = null;
    this.resizing = false;
    this.movingAnchor = null;
  };

  hide() {
    const { eventCenter } = this.muya;
    const circles = this.container.querySelectorAll(".bar");
    Array.from(circles).forEach((c) => c.remove());
    this.status = false;
    eventCenter.emit("muya-float", this, false);
  }
}

export default ImageResizeBar;
