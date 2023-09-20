// @ts-nocheck
import Parent from "@muya/block/base/parent";
import ScrollPage from "@muya/block/scrollPage";
import { h, toHTML } from "@muya/utils/snabbdom";
import copyIcon from "@muya/assets/icons/copy/2.png";
import logger from "@muya/utils/logger";
import CodeBlock from "./index";
import { TState } from "../../../jsonState/types";

const debug = logger("code:");

const renderCopyButton = (i18n) => {
  const selector = "a.mu-code-copy";
  const iconVnode = h(
    "i.icon",
    h(
      "i.icon-inner",
      {
        style: {
          background: `url(${copyIcon}) no-repeat`,
          "background-size": "100%",
        },
      },
      ""
    )
  );

  return h(
    selector,
    {
      attrs: {
        title: i18n.t("Copy content"),
        contenteditable: "false",
      },
    },
    iconVnode
  );
};

class Code extends Parent {
  public parent: CodeBlock;

  static blockName = "code";

  static create(muya, state) {
    const code = new Code(muya, state);

    code.append(ScrollPage.loadBlock("codeblock.content").create(muya, state));

    return code;
  }

  get path() {
    const { path: pPath } = this.parent;

    return [...pPath];
  }

  constructor(muya, state?) {
    super(muya);
    this.tagName = "code";
    this.classList = ["mu-code"];
    this.createDomNode();
    this.createCopyNode();
    this.listen();
  }

  getState(): TState {
    debug.warn("You can never call `getState` in code");
    return;
  }

  createCopyNode() {
    const { i18n } = this.muya;
    this.domNode.innerHTML = toHTML(renderCopyButton(i18n));
  }

  listen() {
    const { eventCenter, editor } = this.muya;
    const clickHandler = (event) => {
      event.preventDefault();
      event.stopPropagation();
      const codeContent = this.firstContentInDescendant();
      editor.clipboard.copy("copyCodeContent", (codeContent as any).text);
    };

    const mousedownHandler = (event) => {
      event.preventDefault();
    };

    eventCenter.attachDOMEvent(
      this.domNode.firstElementChild,
      "click",
      clickHandler
    );
    eventCenter.attachDOMEvent(
      this.domNode.firstElementChild,
      "mousedown",
      mousedownHandler
    );
  }
}

export default Code;
