import { createApi } from "unsplash-js";
import BaseFloat from "../baseFloat";
import { patch, h } from "@muya/utils/snabbdom";
import { EVENT_KEYS, URL_REG, isWin } from "@muya/config";
import { getUniqueId } from "@muya/utils";
import { getImageInfo, getImageSrc } from "@muya/utils/image";
import logger from "@muya/utils/logger";

import "./index.css";

const debug = logger("image selector:");

const toJson = (res) => {
  if (res.type === "success") {
    return Promise.resolve(res.response);
  } else {
    return Promise.reject(new Error(res.type));
  }
};

class ImageSelector extends BaseFloat {
  static pluginName = "imageSelector";
  private renderArray: any[];
  private oldVnode: any;
  private imageInfo: any;
  private unsplash: any;
  private photoList: any[];
  private loading: boolean;
  private block: any;
  private tab: string;
  private isFullMode: boolean;
  private state: { alt: string; src: string; title: string };
  private imageSelectorContainer: HTMLDivElement;

  constructor(muya, options) {
    const name = "mu-image-selector";
    const { unsplashAccessKey } = options;

    options = Object.assign(options, {
      placement: "bottom-center",
      modifiers: {
        offset: {
          offset: "0, 0",
        },
      },
      showArrow: false,
    });
    super(muya, name, options);
    this.renderArray = [];
    this.oldVnode = null;
    this.imageInfo = null;
    if (!unsplashAccessKey) {
      this.unsplash = null;
    } else {
      this.unsplash = createApi({
        accessKey: unsplashAccessKey,
      });
    }
    this.photoList = [];
    this.loading = false;
    this.block = null;
    this.tab = "link"; // select or link
    this.isFullMode = false; // is show title and alt input
    this.state = {
      alt: "",
      src: "",
      title: "",
    };
    const imageSelectorContainer = (this.imageSelectorContainer =
      document.createElement("div"));
    this.container.appendChild(imageSelectorContainer);
    this.floatBox.classList.add("mu-image-selector-wrapper");
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

          if (this.unsplash) {
            // Load latest unsplash photos.
            this.loading = true;
            this.unsplash.photos
              .list({
                perPage: 40,
              })
              .then(toJson)
              .then((json) => {
                this.loading = false;
                if (Array.isArray(json.results)) {
                  this.photoList = json.results;
                  if (this.tab === "unsplash") {
                    this.render();
                  }
                }
              });
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

  searchPhotos = (keyword) => {
    if (!this.unsplash) {
      return;
    }

    this.loading = true;
    this.photoList = [];
    this.unsplash.search
      .getPhotos({
        query: keyword,
        page: 1,
        perPage: 40,
      })
      .then(toJson)
      .then((json) => {
        this.loading = false;
        if (Array.isArray(json.results)) {
          this.photoList = json.results;
          if (this.tab === "unsplash") {
            this.render();
          }
        }
      });

    return this.render();
  };

  tabClick(event, tab) {
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
    const reference: HTMLInputElement = this.imageSelectorContainer.querySelector("input.src");
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

    if (this.unsplash) {
      tabs.push({
        label: i18n.t("Unsplash"),
        value: "unsplash",
      });
    }

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
    } else {
      const searchInput = h("input.search", {
        props: {
          placeholder: i18n.t("Search photos on Unsplash"),
        },
        on: {
          keydown: (event) => {
            const value = (event.target as HTMLInputElement).value;
            if (event.key === EVENT_KEYS.Enter && value) {
              event.preventDefault();
              event.stopPropagation();
              this.searchPhotos(value);
            }
          },
        },
      });
      bodyContent = [searchInput];
      if (this.loading) {
        const loadingCom = h("div.mu-plugin-loading");
        bodyContent.push(loadingCom);
      } else if (this.photoList.length === 0) {
        const noDataCom = h("div.no-data", "No result...");
        bodyContent.push(noDataCom);
      } else {
        const photos = this.photoList.map((photo) => {
          const imageWrapper = h(
            "div.image-wrapper",
            {
              props: {
                style: `background: ${photo.color};`,
              },
              on: {
                click: () => {
                  const title = photo.user.name;
                  const alt = photo.alt_description;
                  const src = photo.urls.regular;
                  const { id: photoId } = photo;
                  this.unsplash.photos
                    .get({ photoId })
                    .then(toJson)
                    .then((result) => {
                      this.unsplash.photos.trackDownload({
                        downloadLocation: result.links.download_location,
                      });
                    });

                  return this.replaceImageAsync({ alt, title, src });
                },
              },
            },
            h("img", {
              props: {
                src: photo.urls.thumb,
              },
            })
          );

          const desCom = h("div.des", [
            "By ",
            h(
              "a",
              {
                props: {
                  href: photo.links.html,
                },
                on: {
                  click: () => {
                    if (this.options.photoCreatorClick) {
                      this.options.photoCreatorClick(photo.user.links.html);
                    }
                  },
                },
              },
              photo.user.name
            ),
          ]);

          return h("div.photo", [imageWrapper, desCom]);
        });
        const photoWrapper = h("div.photos-wrapper", photos);
        const moreCom = h("div.more", i18n.t("Search for more photos..."));
        bodyContent.push(photoWrapper, moreCom);
      }
    }

    return h("div.image-select-body", bodyContent);
  };

  render() {
    const { oldVnode, imageSelectorContainer } = this;
    const { i18n } = this.muya;
    const selector = "div";
    const vnode = h(selector, [this.renderHeader(i18n), this.renderBody(i18n)]);

    if (oldVnode) {
      patch(oldVnode, vnode);
    } else {
      patch(imageSelectorContainer, vnode);
    }

    this.oldVnode = vnode;
  }
}

export default ImageSelector;
