// @ts-nocheck
import Renderer from "@muya/inlineRenderer/renderer";
import { tokenizer } from "@muya/inlineRenderer/lexer";
import logger from "@muya/utils/logger";
import { beginRules } from "@muya/inlineRenderer/rules";
import Muya from "@muya/index";

const debug = logger("inlinerenderer:");

class InlineRenderer {
  public labels: Map<any, any> = new Map();
  public renderer: Renderer;

  constructor(public muya: Muya) {
    this.labels = new Map();
    this.renderer = new Renderer(muya, this);
  }

  tokenizer(block, highlights) {
    const { options } = this.muya;
    const { text } = block;
    const { labels } = this;

    // TODO: different content block should have different rules.
    // eg: atxheading.content has no soft|hard line break
    // setextheading.content has no heading rules.
    const hasBeginRules =
      /thematicbreak\.content|paragraph\.content|atxheading\.content/.test(
        block.blockName
      );

    return tokenizer(text, { hasBeginRules, labels, options, highlights });
  }

  patch(block, cursor?, highlights = []) {
    this.collectReferenceDefinitions();
    const { domNode } = block;
    if (block.isLeafBlock) {
      (debug as any).error("Patch can only handle content block");
    }

    const tokens = this.tokenizer(block, highlights);
    const html = this.renderer.output(
      tokens,
      block,
      cursor && cursor.block === block ? cursor : {}
    );
    domNode.innerHTML = html;
  }

  collectReferenceDefinitions() {
    const state = this.muya.editor.jsonState.getState();
    const labels = new Map();

    const travel = (sts) => {
      if (Array.isArray(sts) && sts.length) {
        for (const st of sts) {
          if (st.name === "paragraph") {
            const { label, info } = this.getLabelInfo(st);
            if (label && info) {
              labels.set(label, info);
            }
          } else if (st.children) {
            travel(st.children);
          }
        }
      }
    };

    travel(state);

    this.labels = labels;
  }

  getLabelInfo(block) {
    const { text } = block;
    const tokens = beginRules.reference_definition.exec(text);
    let label = null;
    let info = null;
    if (tokens) {
      label = (tokens[2] + tokens[3]).toLowerCase();
      info = {
        href: tokens[6],
        title: tokens[10] || "",
      };
    }

    return { label, info };
  }
}

export default InlineRenderer;
