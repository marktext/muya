// @ts-nocheck
import BaseScrollFloat from "../baseScrollFloat";
import { patch, h } from "@muya/utils/snabbdom";
import { search } from "@muya/utils/prism";
import ScrollPage from "@muya/block/scrollPage";
import fileIcons from "../fileIcons";

import "./index.css";

const defaultOptions = {
  placement: "bottom-start",
  modifiers: {
    offset: {
      offset: "0, 0",
    },
  },
  showArrow: false,
};

class CodePicker extends BaseScrollFloat {
  static pluginName = "codePicker";
  private oldVnode: any;
  private block: any;

  constructor(muya, options = {}) {
    const name = "mu-list-picker";
    const opts = Object.assign({}, defaultOptions, options);
    super(muya, name, opts);
    this.renderArray = [];
    this.oldVnode = null;
    this.activeItem = null;
    this.block = null;
    this.listen();
  }

  listen() {
    super.listen();
    const { eventCenter } = this.muya;
    eventCenter.on("muya-code-picker", ({ reference, lang, block }) => {
      const modes = search(lang ?? "");
      if (modes.length && reference) {
        this.block = block;
        this.show(reference);
        this.renderArray = modes;
        this.activeItem = modes[0];
        this.render();
      } else {
        this.hide();
      }
    });
  }

  render() {
    const { renderArray, oldVnode, scrollElement, activeItem } = this;
    let children = renderArray.map((item) => {
      let iconClassNames;
      if (item.name) {
        iconClassNames = fileIcons.getClassByLanguage(item.name);
      }

      // Because `markdown mode in Codemirror` don't have extensions.
      // if still can not get the className, add a common className 'atom-icon light-cyan'
      if (!iconClassNames) {
        iconClassNames =
          item.name === "markdown"
            ? fileIcons.getClassByName("fackname.md")
            : "atom-icon light-cyan";
      }
      const iconSelector =
        "span" +
        iconClassNames
          .split(/\s/)
          .map((s) => `.${s}`)
          .join("");
      const icon = h("div.icon-wrapper", h(iconSelector));
      const text = h("div.language", item.name);
      const selector = activeItem === item ? "li.item.active" : "li.item";

      return h(
        selector,
        {
          dataset: {
            label: item.name,
          },
          on: {
            click: () => {
              this.selectItem(item);
            },
          },
        },
        [icon, text]
      );
    });

    if (children.length === 0) {
      children = [h("div.no-result", "No result")];
    }
    const vnode = h("ul", children);

    if (oldVnode) {
      patch(oldVnode, vnode);
    } else {
      patch(scrollElement, vnode);
    }
    this.oldVnode = vnode;
  }

  getItemElement(item) {
    const { name } = item;

    return this.floatBox.querySelector(`[data-label="${name}"]`);
  }

  selectItem(item) {
    const { block, muya } = this;
    const { name } = item;

    if (block.blockName === "paragraph.content") {
      const state =
        muya.options.isGitlabCompatibilityEnabled && name === "math"
          ? {
              name: "math-block",
              meta: {
                mathStyle: "gitlab",
              },
              text: "",
            }
          : {
              name: "code-block",
              meta: {
                lang: name,
                type: "fenced",
              },
              text: "",
            };

      const newBlock = ScrollPage.loadBlock(state.name).create(
        this.muya,
        state
      );
      block.parent.replaceWith(newBlock);
      const codeContent = newBlock.lastContentInDescendant();
      codeContent.setCursor(0, 0);
    } else {
      const languageInput = block.firstContentInDescendant();
      languageInput.text = name;
      languageInput.update();
      block.lang = name;
      block.lastContentInDescendant().setCursor(0, 0);
    }

    super.selectItem(item);
  }
}

export default CodePicker;
