import copyIcon from "@muya/assets/icons/copy/2.png";
import Parent from "@muya/block/base/parent";
import ScrollPage from "@muya/block/scrollPage";
import I18n from "@muya/i18n";
import Muya from "@muya/index";
import { Nullable } from "@muya/types";
import logger from "@muya/utils/logger";
import { h, toHTML } from "@muya/utils/snabbdom";
import { ICodeBlockState, TState } from "../../../state/types";
import CodeBlock from "./index";

const debug = logger("code:");

const renderCopyButton = (i18n: I18n) => {
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
  public parent: Nullable<CodeBlock> = null;

  static blockName = "code";

  static create(muya: Muya, state: ICodeBlockState) {
    const code = new Code(muya);

    code.append(ScrollPage.loadBlock("codeblock.content").create(muya, state));

    return code;
  }

  get path() {
    const { path: pPath } = this.parent!;

    return [...pPath];
  }

  constructor(muya: Muya) {
    super(muya);
    this.tagName = "code";
    this.classList = ["mu-code"];
    this.createDomNode();
    this.createCopyNode();
    this.listen();
  }

  getState(): TState {
    debug.warn("You can never call `getState` in code");
    return {} as TState;
  }

  // Create the copy button at the top-right.
  createCopyNode() {
    const { i18n } = this.muya;
    this.domNode!.innerHTML = toHTML(renderCopyButton(i18n));
  }

  listen() {
    const { eventCenter, editor } = this.muya;
    // Copy code content to clipboard.
    const clickHandler = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();

      const codeContent = this.firstContentInDescendant();
      editor.clipboard.copy("copyCodeContent", codeContent.text);
    };

    const mousedownHandler = (event: Event) => {
      event.preventDefault();
    };

    eventCenter.attachDOMEvent(
      this.domNode?.firstElementChild as HTMLElement,
      "click",
      clickHandler
    );
    eventCenter.attachDOMEvent(
      this.domNode?.firstElementChild as HTMLElement,
      "mousedown",
      mousedownHandler
    );
  }
}

export default Code;
