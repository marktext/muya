import { patch, h } from "@muya/utils/snabbdom";
import BaseFloat from "../baseFloat";
import icons from "./config";

import "./index.css";

const defaultOptions = {
  placement: "top",
  modifiers: {
    offset: {
      offset: "0, 10",
    },
  },
  showArrow: false,
};

class ImageToolbar extends BaseFloat {
  static pluginName = "imageToolbar";
  private oldVnode: any;
  private imageInfo: any;
  private icons: { type: string; tooltip: string; icon: any; }[];
  private reference: any;
  private block: any;
  private toolbarContainer: HTMLDivElement;

  constructor(muya, options = {}) {
    const name = "mu-image-toolbar";
    const opts = Object.assign({}, defaultOptions, options);

    super(muya, name, opts);
    this.oldVnode = null;
    this.imageInfo = null;
    this.options = opts;
    this.icons = icons;
    this.reference = null;
    this.block = null;

    const toolbarContainer = (this.toolbarContainer =
      document.createElement("div"));
    this.container.appendChild(toolbarContainer);
    this.floatBox.classList.add("mu-image-toolbar-container");

    this.listen();
  }

  listen() {
    const { eventCenter } = this.muya;
    super.listen();
    eventCenter.on("muya-image-toolbar", ({ block, reference, imageInfo }) => {
      this.reference = reference;
      if (reference) {
        this.block = block;
        this.imageInfo = imageInfo;
        setTimeout(() => {
          this.show(reference);
          this.render();
        }, 0);
      } else {
        this.hide();
      }
    });
  }

  render() {
    const { icons, oldVnode, toolbarContainer, imageInfo } = this;
    const { i18n } = this.muya;
    const { attrs } = imageInfo.token;
    const dataAlign = attrs["data-align"];
    const children = icons.map((i) => {
      let icon;
      let iconWrapperSelector;
      if (i.icon) {
        // SVG icon Asset
        iconWrapperSelector = "div.icon-wrapper";
        icon = h(
          "i.icon",
          h(
            "i.icon-inner",
            {
              style: {
                background: `url(${i.icon}) no-repeat`,
                "background-size": "100%",
              },
            },
            ""
          )
        );
      }
      const iconWrapper = h(iconWrapperSelector, icon);
      let itemSelector = `li.item.${i.type}`;

      if (i.type === dataAlign || (!dataAlign && i.type === "inline")) {
        itemSelector += ".active";
      }

      return h(
        itemSelector,
        {
          dataset: {
            tip: i.tooltip,
          },
          attrs: {
            title: i18n.t(i.tooltip),
          },
          on: {
            click: (event) => {
              this.selectItem(event, i);
            },
          },
        },
        iconWrapper
      );
    });

    const vnode = h("ul", children);

    if (oldVnode) {
      patch(oldVnode, vnode);
    } else {
      patch(toolbarContainer, vnode);
    }
    this.oldVnode = vnode;
  }

  selectItem(event, item) {
    event.preventDefault();
    event.stopPropagation();

    const { imageInfo } = this;

    switch (item.type) {
      // Delete image.
      case "delete":
        this.block.deleteImage(imageInfo);
        // Hide image transformer
        this.muya.eventCenter.emit("muya-transformer", {
          reference: null,
        });

        return this.hide();

      // Edit image, for example: editor alt and title, replace image.
      case "edit": {
        const rect = this.reference.getBoundingClientRect();
        const reference = {
          getBoundingClientRect() {
            rect.height = 0;

            return rect;
          },
        };
        // Hide image transformer
        this.muya.eventCenter.emit("muya-transformer", {
          reference: null,
        });
        this.muya.eventCenter.emit("muya-image-selector", {
          reference,
          imageInfo,
          cb: () => {},
        });

        return this.hide();
      }

      case "inline":

      case "left":

      case "center":

      case "right": {
        this.block.updateImage(this.imageInfo, "data-align", item.type);

        return this.hide();
      }
    }
  }
}

export default ImageToolbar;
