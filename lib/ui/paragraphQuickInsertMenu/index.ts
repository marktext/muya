import Fuse from "fuse.js";
import { patch, h } from "@muya/utils/snabbdom";
import { deepClone } from "@muya/utils";
import BaseScrollFloat from "@muya/ui/baseScrollFloat";
import ParagraphContent from "@muya/block/content/paragraphContent";
import { MENU_CONFIG, replaceBlockByLabel, getLabelFromEvent } from "./config";

import "./index.css";
import { VNode } from "snabbdom";
import Muya from "@muya/index";

const checkCanInsertFrontMatter = (muya: Muya, block: ParagraphContent) => {
  const { frontMatter } = muya.options;

  return (
    frontMatter &&
    !block.parent.prev &&
    block?.parent?.parent?.blockName === "scrollpage"
  );
};

class QuickInsert extends BaseScrollFloat {
  static pluginName = "quickInsert";

  public oldVNode: VNode | null = null;
  public block: ParagraphContent | null = null;
  private _renderData: Array<any>;

  constructor(muya: Muya) {
    const name = "mu-quick-insert";
    super(muya, name);
    this._renderData = null;
    this.renderArray = null;
    this.activeItem = null;
    this.renderData = MENU_CONFIG;
    this.render();
    this.listen();
  }

  get renderData() {
    return this._renderData;
  }

  set renderData(data) {
    this._renderData = data;

    this.renderArray = data.flatMap((d) => d.children);
    if (this.renderArray.length > 0) {
      this.activeItem = this.renderArray[0];
      const activeEle = this.getItemElement(this.activeItem) as HTMLElement;
      this.activeEleScrollIntoView(activeEle);
    }
  }

  listen() {
    super.listen();
    const { eventCenter, editor, domNode } = this.muya;
    eventCenter.subscribe(
      "muya-quick-insert",
      ({ reference, block, status }) => {
        if (status) {
          this.block = block;
          this.show(reference);
          this.search(block.text.substring(1)); // remove `/` char
        } else {
          this.hide();
        }
      }
    );

    const handleKeydown = (event: Event) => {
      const { anchorBlock, isSelectionInSameBlock } =
        editor.selection.getSelection();
      if (isSelectionInSameBlock && anchorBlock instanceof ParagraphContent) {
        if (anchorBlock.text) {
          return;
        }
        const label = getLabelFromEvent(event);
        if (label) {
          event.preventDefault();
          replaceBlockByLabel({
            label,
            block: anchorBlock.parent,
            muya: this.muya,
          });
        }
      }
    };

    eventCenter.attachDOMEvent(domNode, "keydown", handleKeydown);
  }

  render() {
    const { scrollElement, activeItem, renderData } = this;
    const { i18n } = this.muya;
    let children = renderData.map((section) => {
      const titleVnode = h("div.title", i18n.t(section.name).toUpperCase());
      const items = [];

      for (const item of section.children) {
        const { title, subTitle, label, icon, shortCut } = item;
        const iconVnode = h(
          "div.icon-container",
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
          )
        );

        const description = h("div.description", [
          h(
            "div.big-title",
            {
              attrs: { title: subTitle },
            },
            i18n.t(title)
          ),
        ]);
        const shortCutVnode = h("div.short-cut", [h("span", shortCut)]);
        const selector =
          activeItem.label === label ? "div.item.active" : "div.item";
        items.push(
          h(
            selector,
            {
              dataset: { label },
              on: {
                click: () => {
                  this.selectItem(item);
                },
              },
            },
            [iconVnode, description, shortCutVnode]
          )
        );
      }

      return h("section", [titleVnode, ...items]);
    });

    if (children.length === 0) {
      children = [h("div.no-result", i18n.t("No result"))];
    }
    const vnode = h("div", children);

    if (this.oldVNode) {
      patch(this.oldVNode, vnode);
    } else {
      patch(scrollElement!, vnode);
    }
    this.oldVNode = vnode;
  }

  search(text) {
    const { muya, block } = this;
    const { i18n } = muya;
    const canInsertFrontMatter = checkCanInsertFrontMatter(muya, block);
    const menuConfig = deepClone(MENU_CONFIG);

    if (!canInsertFrontMatter) {
      menuConfig
        .find((menu) => menu.name === "basic blocks")
        .children.splice(2, 1);
    }
    let result = menuConfig;
    if (text !== "") {
      result = [];

      for (const menu of menuConfig) {
        for (const child of menu.children) {
          child.i18nTitle = i18n.t(child.title);
        }
        const fuse = new Fuse(menu.children, {
          includeScore: true,
          keys: ["i18nTitle", "title"],
        });
        const match = fuse
          .search(text)
          .map((i) => ({ score: i.score, ...(i as any).item }));
        if (match.length) {
          result.push({
            name: menu.name,
            children: match,
          });
        }
      }

      if (result.length) {
        result.sort((a, b) =>
          a.children[0].score < b.children[0].score ? -1 : 1
        );
      }
    }
    this.renderData = result;
    this.render();
  }

  selectItem({ label }) {
    const { block, muya } = this;
    replaceBlockByLabel({
      label,
      block: block.parent,
      muya,
    });
    // delay hide to avoid dispatch enter handler
    setTimeout(this.hide.bind(this));
  }

  getItemElement(item) {
    const { label } = item;

    return this.scrollElement!.querySelector(`[data-label="${label}"]`);
  }
}

export default QuickInsert;
