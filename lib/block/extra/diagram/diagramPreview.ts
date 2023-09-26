import Parent from "@muya/block/base/parent";
import { PREVIEW_DOMPURIFY_CONFIG } from "@muya/config";
import { sanitize } from "@muya/utils";
import loadRenderer from "@muya/utils/diagram";
import logger from "@muya/utils/logger";
import { IDiagramState, TState } from "../../../state/types";

const debug = logger("diagramPreview:");

const renderDiagram = async ({
  type,
  code,
  target,
  sequenceTheme,
  vegaTheme,
  mermaidTheme,
}) => {
  const render = await loadRenderer(type);
  const options = {};
  if (type === "vega-lite") {
    Object.assign(options, {
      actions: false,
      tooltip: false,
      renderer: "svg",
      theme: vegaTheme,
    });
  }

  if (type === "flowchart") {
    const diagram = render.parse(code);
    target.innerHTML = "";
    diagram.drawSVG(target, options);
  } else if (type === "plantuml") {
    const diagram = render.parse(code);
    target.innerHTML = "";
    diagram.insertImgElement(target);
  } else if (type === "vega-lite") {
    await render(target, JSON.parse(code), options);
  } else if (type === "mermaid") {
    render.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: mermaidTheme,
    });
    await render.parse(code);
    target.innerHTML = sanitize(code, PREVIEW_DOMPURIFY_CONFIG, true);
    target.removeAttribute("data-processed");
    await render.run({
      nodes: [target],
    });
  }
};

class DiagramPreview extends Parent {
  public code: string;
  public type: string;
  static blockName = "diagram-preview";

  static create(muya, state) {
    const diagramPreview = new DiagramPreview(muya, state);

    return diagramPreview;
  }

  get path() {
    debug.warn("You can never call `get path` in diagramPreview");
    return [];
  }

  constructor(muya, { text, meta }: IDiagramState) {
    super(muya);
    this.tagName = "div";
    this.code = text;
    this.type = meta.type;
    this.classList = ["mu-diagram-preview"];
    this.attributes = {
      spellcheck: "false",
      contenteditable: "false",
    };
    this.createDomNode();
    this.attachDOMEvents();
    this.update();
  }

  getState(): TState {
    debug.warn("You can never call `getState` in diagramPreview");
    return;
  }

  attachDOMEvents() {
    const { eventCenter } = this.muya;

    eventCenter.attachDOMEvent(
      this.domNode,
      "click",
      this.clickHandler.bind(this)
    );
  }

  clickHandler(event) {
    event.preventDefault();
    event.stopPropagation();

    const cursorBlock = this.parent.firstContentInDescendant();
    cursorBlock.setCursor(0, 0);
  }

  async update(code = this.code) {
    const { i18n } = this.muya;
    if (this.code !== code) {
      this.code = code;
    }

    if (code) {
      this.domNode.innerHTML = i18n.t("Loading...");
      const { mermaidTheme, sequenceTheme, vegaTheme } = this.muya.options;
      const { type } = this;

      try {
        await renderDiagram({
          target: this.domNode,
          code,
          type,
          mermaidTheme,
          sequenceTheme,
          vegaTheme,
        });
      } catch (err) {
        this.domNode.innerHTML = `<div class="mu-diagram-error">&lt; ${i18n.t(
          "Invalid Diagram Code"
        )} &gt;</div>`;
      }
    } else {
      this.domNode.innerHTML = `<div class="mu-empty">&lt; ${i18n.t(
        "Empty Diagram"
      )} &gt;</div>`;
    }
  }
}

export default DiagramPreview;
