import EventCenter from "@/event/index";
import Editor from "@/editor/index";
import Ui from "@/ui/index";
import I18n from "@/i18n/index";
import {
  BLOCK_DOM_PROPERTY,
  MUYA_DEFAULT_OPTIONS,
  CLASS_NAMES,
} from "@/config/index";

import { MuyaOptions } from "../types/muya";

import "./assets/styles/index.css";
import "./assets/styles/prismjs/light.theme.css";
import "./assets/styles/inlineSyntax.css";
import "./assets/styles/blockSyntax.css";

class Muya {
  static plugins = [];

  static use(plugin, options = {}) {
    this.plugins.push({
      plugin,
      options,
    });
  }

  public readonly version: string =
    typeof window.MUYA_VERSION === "undefined" ? "dev" : window.MUYA_VERSION;

  public options: MuyaOptions;
  public eventCenter: EventCenter;
  public domNode: HTMLElement;
  public editor: Editor;
  public ui: Ui;
  public i18n: I18n;

  constructor(element: HTMLElement, options = {}) {
    this.options = Object.assign({}, MUYA_DEFAULT_OPTIONS, options);
    this.eventCenter = new EventCenter();
    this.domNode = getContainer(element, options);
    this.domNode[BLOCK_DOM_PROPERTY] = this;
    this.editor = new Editor(this);
    this.ui = new Ui(this);
    this.i18n = new I18n(this, this.options.locale);
  }

  init() {
    this.editor.init();
    this.exportAPI();
    // UI plugins
    if (Muya.plugins.length) {
      for (const { plugin: Plugin, options: opts } of Muya.plugins) {
        this.ui[Plugin.pluginName] = new Plugin(this, opts);
      }
    }
  }

  locale(object) {
    return this.i18n.locale(object);
  }

  exportAPI() {
    const apis = {
      eventCenter: ["on", "off", "once"],
      editor: [
        "getState",
        "getMarkdown",
        "undo",
        "redo",
        "search",
        "find",
        "replace",
        "setContent",
        "focus",
        "selectAll",
      ],
    };

    Object.keys(apis).forEach((key) => {
      for (const api of apis[key]) {
        this[api] = this[key][api].bind(this[key]);
      }
    });
  }

  destroy() {
    this.eventCenter.detachAllDomEvents();
    this.domNode[BLOCK_DOM_PROPERTY] = null;
    if (this.domNode.remove) {
      this.domNode.remove();
    }
    // Hide all float tools.
    if (this.ui) {
      this.ui.hideAllFloatTools();
    }
  }
}

/**
 * [ensureContainerDiv ensure container element is div]
 */
function getContainer(originContainer, options) {
  const { spellcheckEnabled, hideQuickInsertHint } = options;
  const newContainer = document.createElement("div");
  const attrs = originContainer.attributes;
  // Copy attrs from origin container to new container
  Array.from(attrs).forEach((attr: { name: string; value: string; }) => {
    newContainer.setAttribute(attr.name, attr.value);
  });

  if (!hideQuickInsertHint) {
    newContainer.classList.add(CLASS_NAMES.MU_SHOW_QUICK_INSERT_HINT);
  }

  newContainer.classList.add(CLASS_NAMES.MU_EDITOR);

  newContainer.setAttribute("contenteditable", "true");
  newContainer.setAttribute("autocorrect", "false");
  newContainer.setAttribute("autocomplete", "off");
  newContainer.setAttribute("spellcheck", !!spellcheckEnabled ? "true" : "false");
  originContainer.replaceWith(newContainer);

  return newContainer;
}

export default Muya;
