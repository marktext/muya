import BaseScrollFloat from "../baseScrollFloat";
import { patch, h } from "@muya/utils/snabbdom";
import { search } from "@muya/utils/prism";
import ScrollPage from "@muya/block/scrollPage";
import fileIcons from "../fileIcons";

import type { VNode } from "snabbdom";
import type Muya from "@muya/index";
import type ParagraphContent from "@muya/block/content/paragraphContent";
import type CodeBlock from "@muya/block/commonMark/codeBlock";

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
  private oldVNode: VNode | null = null;
  private block: ParagraphContent | CodeBlock | null = null;

  constructor(muya: Muya, options = {}) {
    const name = "mu-list-picker";
    const opts = Object.assign({}, defaultOptions, options);
    super(muya, name, opts);
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
    const { renderArray, oldVNode, scrollElement, activeItem } = this;
    let children = (
      renderArray as {
        name: string;
        [key: string]: string;
      }[]
    ).map((item) => {
      let iconClassNames;
      if (item.name) {
        iconClassNames = fileIcons.getClassByLanguage(item.name);
      }

      // Because `markdown mode in Codemirror` don't have extensions.
      // if still can not get the className, add a common className 'atom-icon light-cyan'
      if (!iconClassNames) {
        iconClassNames =
          item.name === "markdown"
            ? fileIcons.getClassByName("fakeName.md")
            : "atom-icon light-cyan";
      }
      const iconSelector =
        "span" +
        iconClassNames
          .split(/\s/)
          .map((s: string) => `.${s}`)
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

    if (oldVNode) {
      patch(oldVNode, vnode);
    } else {
      patch(scrollElement!, vnode);
    }
    this.oldVNode = vnode;
  }

  getItemElement(item: { name: string }): HTMLElement {
    const { name } = item;

    // Item element will always existed, so use !.
    return this.floatBox!.querySelector(`[data-label="${name}"]`)!;
  }

  selectItem(item: { name: string }) {
    const { block, muya } = this;
    const { name } = item;

    if (!block) {
      return;
    }

    function isParagraphContent(
      b: ParagraphContent | CodeBlock
    ): b is ParagraphContent {
      return b.blockName === "paragraph.content";
    }

    if (isParagraphContent(block)) {
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
      block.parent?.replaceWith(newBlock);
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
