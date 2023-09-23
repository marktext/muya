import BaseFloat from "../baseFloat";
import { patch, h } from "@muya/utils/snabbdom";
import { EVENT_KEYS, URL_REG, isWin } from "@muya/config";
import { getUniqueId } from "@muya/utils";
import { getImageInfo, getImageSrc } from "@muya/utils/image";
import logger from "@muya/utils/logger";

import "./index.css";
import { VNode } from "snabbdom";
import Muya from "@muya/index";

const debug = logger("image selector:");

const defaultOptions = {
  placement: "bottom-center" as const,
  modifiers: {
    offset: {
      offset: "0, 0",
    },
  },
  showArrow: false,
}

class ImageSelector extends BaseFloat {
  static pluginName = "imageSelector";
  private oldVNode: VNode | null = null;
  private imageInfo: any;
  private block: any;
  private tab: string = "link";
  private isFullMode: boolean;
  private state: { alt: string; src: string; title: string };
  private imageSelectorContainer: HTMLDivElement = document.createElement("div");

  constructor(muya: Muya) {
    const name = "mu-image-selector";
    super(muya, name, Object.assign({}, defaultOptions));

    this.imageInfo = null;
    this.block = null;
    this.isFullMode = false; // is show title and alt input
    this.state = {
      alt: "",
      src: "",
      title: "",
    };

    this.container!.appendChild(this.imageSelectorContainer);
    this.floatBox!.classList.add("mu-image-selector-wrapper");
    this.listen();
  }

  listen() {
    super.listen();
    const { eventCenter } = this.muya;
    eventCenter.on(
      "muya-image-selector",
      ({ block, reference, cb, imageInfo }) => {
        if (reference) {
          this.block = block;

          Object.assign(this.state, imageInfo.token.attrs);

          // Remove file protocol to allow autocomplete.
          const imageSrc = this.state.src;
          if (imageSrc && /^file:\/\//.test(imageSrc)) {
            let protocolLen = 7;
            if (isWin && /^file:\/\/\//.test(imageSrc)) {
              protocolLen = 8;
            }
            this.state.src = imageSrc.substring(protocolLen);
          }

          this.imageInfo = imageInfo;
          this.show(reference, cb);
          this.render();

          // Auto focus and select all content of the `src.input` element.
          const input = this.imageSelectorContainer.querySelector("input.src");
          if (input) {
            (input as HTMLInputElement).focus();
            (input as HTMLInputElement).select();
          }
        } else {
          this.hide();
        }
      }
    );
  }

  tabClick(_event: Event, tab) {
    const { value } = tab;
    this.tab = value;

    return this.render();
  }

  toggleMode() {
    this.isFullMode = !this.isFullMode;

    return this.render();
  }

  inputHandler(event, type) {
    const value = event.target.value;
    this.state[type] = value;
  }

  handleKeyDown(event) {
    if (event.key === EVENT_KEYS.Enter) {
      event.stopPropagation();
      this.handleLinkButtonClick();
    }
  }

  srcInputKeyDown(event) {
    const { imagePathPicker } = this.muya as any;
    if (!imagePathPicker) {
      return;
    }

    if (!imagePathPicker.status) {
      if (event.key === EVENT_KEYS.Enter) {
        event.stopPropagation();
        this.handleLinkButtonClick();
      }

      return;
    }

    switch (event.key) {
      case EVENT_KEYS.ArrowUp:
        event.preventDefault();
        imagePathPicker.step("previous");
        break;

      case EVENT_KEYS.ArrowDown:
        // fall through
      case EVENT_KEYS.Tab:
        event.preventDefault();
        imagePathPicker.step("next");
        break;

      case EVENT_KEYS.Enter:
        event.preventDefault();
        imagePathPicker.selectItem(imagePathPicker.activeItem);
        break;
      default:
        break;
    }
  }

  async handleKeyUp(event) {
    const { key } = event;
    if (
      key === EVENT_KEYS.ArrowUp ||
      key === EVENT_KEYS.ArrowDown ||
      key === EVENT_KEYS.Tab ||
      key === EVENT_KEYS.Enter
    ) {
      return;
    }
    const value = event.target.value;
    const { eventCenter } = this.muya;
    const reference: HTMLInputElement =
      this.imageSelectorContainer.querySelector("input.src");
    const cb = (item) => {
      const { text } = item;

      let basePath = "";
      const pathSep = value.match(/(\/|\\)(?:[^/\\]+)$/);
      if (pathSep && pathSep[0]) {
        basePath = value.substring(0, pathSep.index + 1);
      }

      const newValue = basePath + text;
      const len = newValue.length;
      reference.value = newValue;
      this.state.src = newValue;
      reference.focus();
      reference.setSelectionRange(len, len);
    };

    let list;
    if (!value) {
      list = [];
    } else {
      list = await this.muya.options.imagePathAutoComplete(value);
    }
    eventCenter.emit("muya-image-picker", { reference, list, cb });
  }

  handleLinkButtonClick() {
    return this.replaceImageAsync(this.state);
  }

  replaceImageAsync = async ({ alt, src, title }) => {
    if (!this.muya.options.imageAction || URL_REG.test(src)) {
      const {
        alt: oldAlt,
        src: oldSrc,
        title: oldTitle,
      } = this.imageInfo.token.attrs;
      if (alt !== oldAlt || src !== oldSrc || title !== oldTitle) {
        this.block.replaceImage(this.imageInfo, { alt, src, title });
      }
      this.hide();
    } else {
      if (src) {
        const id = `loading-${getUniqueId()}`;
        this.block.replaceImage(this.imageInfo, {
          alt: id,
          src,
          title,
        });
        this.hide();
        const nSrc = await this.muya.options.imageAction({ src, id, alt });
        const { src: localPath } = getImageSrc(src);
        if (localPath) {
          this.muya.editor.inlineRenderer.renderer.urlMap.set(nSrc, localPath);
        }
        const imageWrapper = this.muya.domNode.querySelector(
          `span[data-id=${id}]`
        );

        if (imageWrapper) {
          const imageInfo = getImageInfo(imageWrapper);
          this.block.replaceImage(imageInfo, {
            alt,
            src: nSrc,
            title,
          });
        }
      } else {
        this.hide();
      }
    }
  };

  async handleSelectButtonClick() {
    if (!this.muya.options.imagePathPicker) {
      debug.warn("You need to add a imagePathPicker option");

      return;
    }

    const path = await this.muya.options.imagePathPicker();
    const { alt, title } = this.state;

    return this.replaceImageAsync({
      alt,
      title,
      src: path,
    });
  }

  renderHeader(i18n) {
    const tabs = [
      {
        label: i18n.t("Select"),
        value: "select",
      },
      {
        label: i18n.t("Embed link"),
        value: "link",
      },
    ];

    const children = tabs.map((tab) => {
      const itemSelector = this.tab === tab.value ? "li.active" : "li";

      return h(
        itemSelector,
        h(
          "span",
          {
            on: {
              click: (event) => {
                this.tabClick(event, tab);
              },
            },
          },
          tab.label
        )
      );
    });

    return h("ul.header", children);
  }

  renderBody = (i18n) => {
    const { tab, state, isFullMode } = this;
    const { alt, title, src } = state;
    let bodyContent = null;
    if (tab === "select") {
      bodyContent = [
        h(
          "button.mu-button.role-button.select",
          {
            on: {
              click: (event) => {
                this.handleSelectButtonClick();
              },
            },
          },
          i18n.t("Choose an Image")
        ),
        h("span.description", i18n.t("Choose image from your computer.")),
      ];
    } else if (tab === "link") {
      const altInput = h("input.alt", {
        props: {
          placeholder: i18n.t("Alt text"),
          value: alt,
        },
        on: {
          input: (event) => {
            this.inputHandler(event, "alt");
          },
          paste: (event) => {
            this.inputHandler(event, "alt");
          },
          keydown: (event) => {
            this.handleKeyDown(event);
          },
        },
      });
      const srcInput = h("input.src", {
        props: {
          placeholder: i18n.t("Image link or local path"),
          value: src,
        },
        on: {
          input: (event) => {
            this.inputHandler(event, "src");
          },
          paste: (event) => {
            this.inputHandler(event, "src");
          },
          keydown: (event) => {
            this.srcInputKeyDown(event);
          },
          keyup: (event) => {
            this.handleKeyUp(event);
          },
        },
      });
      const titleInput = h("input.title", {
        props: {
          placeholder: i18n.t("Image title"),
          value: title,
        },
        on: {
          input: (event) => {
            this.inputHandler(event, "title");
          },
          paste: (event) => {
            this.inputHandler(event, "title");
          },
          keydown: (event) => {
            this.handleKeyDown(event);
          },
        },
      });

      const inputWrapper = isFullMode
        ? h("div.input-container", [altInput, srcInput, titleInput])
        : h("div.input-container", [srcInput]);

      const embedButton = h(
        "button.mu-button.role-button.link",
        {
          on: {
            click: (event) => {
              this.handleLinkButtonClick();
            },
          },
        },
        i18n.t("Embed Image")
      );
      const bottomDes = h("span.description", [
        h("span", i18n.t("Paste web image or local image path. Use ")),
        h(
          "a",
          {
            on: {
              click: (event) => {
                this.toggleMode();
              },
            },
          },
          `${isFullMode ? i18n.t("simple mode") : i18n.t("full mode")}.`
        ),
      ]);
      bodyContent = [inputWrapper, embedButton, bottomDes];
    }

    return h("div.image-select-body", bodyContent);
  };

  render() {
    const { oldVNode, imageSelectorContainer } = this;
    const { i18n } = this.muya;
    const selector = "div";
    const vnode = h(selector, [this.renderHeader(i18n), this.renderBody(i18n)]);

    if (oldVNode) {
      patch(oldVNode, vnode);
    } else {
      patch(imageSelectorContainer, vnode);
    }

    this.oldVNode = vnode;
  }
}

export default ImageSelector;
