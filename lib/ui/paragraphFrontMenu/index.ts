import BaseFloat from "@muya/ui/baseFloat";
import { patch, h } from "@muya/utils/snabbdom";
import { deepClone } from "@muya/utils";
import emptyStates from "@muya/config/emptyStates";
import ScrollPage from "@muya/block/scrollPage";
import { FRONT_MENU, canTurnIntoMenu } from "./config";
import { replaceBlockByLabel } from "@muya/ui/paragraphQuickInsertMenu/config";

import "./index.css";

const renderIcon = ({ label, icon }) =>
  h(
    "i.icon",
    h(
      `i.icon-${label.replace(/\s/g, "-")}`,
      {
        style: {
          background: `url(${icon}) no-repeat`,
          "background-size": "100%",
        },
      },
      ""
    )
  );

const defaultOptions = {
  placement: "bottom",
  modifiers: {
    offset: {
      offset: "0, 10",
    },
  },
  showArrow: false,
};

class FrontMenu extends BaseFloat {
  static pluginName = "frontMenu";
  private oldVNode: any;
  private block: any;
  private reference: any;
  private frontMenuContainer: HTMLDivElement;

  constructor(muya, options = {}) {
    const name = "mu-front-menu";
    const opts = Object.assign({}, defaultOptions, options);
    super(muya, name, opts);
    this.oldVNode = null;
    this.block = null;
    this.options = opts;
    this.reference = null;
    const frontMenuContainer = (this.frontMenuContainer =
      document.createElement("div"));
    Object.assign((this.container.parentNode as any).style, {
      overflow: "visible",
    });
    this.container.appendChild(frontMenuContainer);
    this.listen();
  }

  listen() {
    const { container } = this;
    const { eventCenter } = this.muya;
    super.listen();
    eventCenter.subscribe("muya-front-menu", ({ reference, block }) => {
      if (reference) {
        this.block = block;
        this.reference = reference;
        setTimeout(() => {
          this.show(reference);
          this.render();
        }, 0);
      }
    });

    const enterLeaveHandler = (event) => {
      this.hide();
      this.reference = null;
    };

    eventCenter.attachDOMEvent(container, "mouseleave", enterLeaveHandler);
  }

  renderSubMenu(subMenu) {
    const { block } = this;
    const { i18n } = this.muya;
    const children = subMenu.map((menuItem) => {
      const { title, label, shortCut, subTitle } = menuItem;
      const iconWrapperSelector = "div.icon-wrapper";
      const iconWrapper = h(
        iconWrapperSelector,
        {
          props: {
            title: `${i18n.t(title)}\n${subTitle}`,
          },
        },
        renderIcon(menuItem)
      );

      let itemSelector = `div.turn-into-item.${label}`;
      if (block.blockName === "atx-heading") {
        if (
          label.startsWith(block.blockName) &&
          label.endsWith(block.meta.level)
        ) {
          itemSelector += ".active";
        }
      } else if (label === block.blockName) {
        itemSelector += ".active";
      }

      return h(
        itemSelector,
        {
          on: {
            click: (event) => {
              this.selectItem(event, { label });
            },
          },
        },
        [iconWrapper]
      );
    });
    const subMenuSelector = "li.turn-into-menu";

    return h(subMenuSelector, children);
  }

  render() {
    const { oldVNode, frontMenuContainer, block } = this;
    const { i18n } = this.muya;
    const { blockName } = block;
    const children = FRONT_MENU.map(({ icon, label, text, shortCut }) => {
      const iconWrapperSelector = "div.icon-wrapper";
      const iconWrapper = h(iconWrapperSelector, renderIcon({ icon, label }));
      const textWrapper = h("span.text", i18n.t(text));
      const shortCutWrapper = h("div.short-cut", [h("span", shortCut)]);
      const itemSelector = `li.item.${label}`;
      const itemChildren = [iconWrapper, textWrapper, shortCutWrapper];

      return h(
        itemSelector,
        {
          on: {
            click: (event) => {
              this.selectItem(event, { label });
            },
          },
        },
        itemChildren
      );
    });

    // Frontmatter can not be duplicated
    if (blockName === "frontmatter") {
      children.splice(0, 1);
    }

    const subMenu = canTurnIntoMenu(block);
    if (subMenu.length) {
      const line = h("li.divider");
      children.unshift(line);
      children.unshift(this.renderSubMenu(subMenu));
    }

    const vnode = h("ul", children);

    if (oldVNode) {
      patch(oldVNode, vnode);
    } else {
      patch(frontMenuContainer, vnode);
    }
    this.oldVNode = vnode;
  }

  selectItem(event, { label }) {
    event.preventDefault();
    event.stopPropagation();
    const { block, muya } = this;
    const { editor } = muya;
    const oldState = block.getState();
    let cursorBlock = null;
    let state = null;
    const { bulletListMarker, orderListDelimiter } = muya.options;

    if (/duplicate|new|delete/.test(label)) {
      switch (label) {
        case "duplicate": {
          state = deepClone(oldState);
          const dupBlock = ScrollPage.loadBlock(state.name).create(muya, state);
          block.parent.insertAfter(dupBlock, block);
          cursorBlock = dupBlock.lastContentInDescendant();
          break;
        }

        case "new": {
          state = deepClone(emptyStates.paragraph);
          const newBlock = ScrollPage.loadBlock("paragraph").create(
            muya,
            state
          );
          block.parent.insertAfter(newBlock, block);
          cursorBlock = newBlock.lastContentInDescendant();
          break;
        }

        case "delete": {
          if (block.prev) {
            cursorBlock = block.prev.lastContentInDescendant();
          } else if (block.next) {
            cursorBlock = block.next.firstContentInDescendant();
          } else {
            state = deepClone(emptyStates.paragraph);
            const newBlock = ScrollPage.loadBlock("paragraph").create(
              muya,
              state
            );
            block.parent.insertAfter(newBlock, block);
            cursorBlock = newBlock.lastContentInDescendant();
          }
          block.remove();
        }
      }
    } else {
      switch (block.blockName) {
        case "paragraph":

        case "atx-heading": {
          if (block.blockName === "paragraph" && block.blockName === label) {
            break;
          }

          if (
            block.blockName === "atx-heading" &&
            label.split(" ")[1] === String(oldState.meta.level)
          ) {
            break;
          }
          const rawText = oldState.text;
          const text =
            block.blockName === "paragraph"
              ? rawText
              : rawText.replace(/^ {0,3}#{1,6}(?:\s{1,}|$)/, "");
          replaceBlockByLabel({
            block,
            label,
            muya,
            text,
          });
          break;
        }

        case "order-list":

        case "bullet-list":

        case "task-list": {
          if (block.blockName === label) {
            break;
          }
          state = deepClone(oldState);
          if (block.blockName === "task-list") {
            state.children.forEach((listItem) => {
              listItem.name = "list-item";
              delete listItem.meta;
            });
          }
          const {
            loose,
            delimiter = orderListDelimiter,
            marker = bulletListMarker,
          } = state.meta;
          if (label === "task-list") {
            state.children.forEach((listItem) => {
              listItem.name = "task-list-item";
              listItem.meta = {
                checked: false,
              };
            });
            state.meta = {
              marker,
              loose,
            };
          } else if (label === "order-list") {
            state.meta = {
              delimiter,
              loose,
            };
          } else {
            state.meta = {
              marker,
              loose,
            };
          }
          const { anchorPath, anchor, focus, isSelectionInSameBlock } =
            editor.selection;
          const listBlock = ScrollPage.loadBlock(label).create(muya, state);
          block.replaceWith(listBlock);
          const guessCursorBlock =
            muya.editor.scrollPage.queryBlock(anchorPath);
          if (guessCursorBlock && isSelectionInSameBlock) {
            const begin = Math.min(anchor.offset, focus.offset);
            const end = Math.max(anchor.offset, focus.offset);
            // Make guessCursorBlock active
            guessCursorBlock.setCursor(begin, end, true);
          } else {
            cursorBlock = listBlock.firstContentInDescendant();
          }
          break;
        }
      }
    }

    if (cursorBlock) {
      // mock cursorBlock focus
      cursorBlock.setCursor(0, 0, true);
    }
    // Delay hide to avoid dispatch enter hander
    setTimeout(this.hide.bind(this));
  }
}

export default FrontMenu;
