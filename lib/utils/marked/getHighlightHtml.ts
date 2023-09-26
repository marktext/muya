import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import Prism from "prismjs";
import emojiExtension from "./extensions/emoji";
import mathExtension from "./extensions/math";
import superSubScriptExtension from "./extensions/superSubscript";
import fm, { frontMatterRender } from "./frontMatter";
import { DEFAULT_OPTIONS } from "./options";
import type { LexOption } from "./types";
import walkTokens from "./walkTokens";

const DIAGRAM_TYPE = [
  "mermaid",
  "flowchart",
  "sequence",
  "plantuml",
  "vega-lite",
];

const marked = new Marked(
  markedHighlight({
    highlight(code, lang) {
      // Language may be undefined (GH#591)
      if (!lang) {
        return code;
      }

      if (DIAGRAM_TYPE.includes(lang)) {
        return code;
      }

      const grammar = Prism.languages[lang];
      if (!grammar) {
        console.warn(`Unable to find grammar for "${lang}".`);
        return code;
      }
      return Prism.highlight(code, grammar, lang);
    },
  })
);

export function getHighlightHtml(src: string, options: LexOption = {}) {
  options = Object.assign({}, DEFAULT_OPTIONS, options);
  const { frontMatter, math, isGitlabCompatibilityEnabled, superSubScript } =
    options;

  let html = "";

  marked.use({
    walkTokens: walkTokens({ math, isGitlabCompatibilityEnabled }),
  });

  marked.use(emojiExtension({ isRenderEmoji: true }));

  if (math) {
    marked.use(
      mathExtension({
        throwOnError: false,
        useKatexRender: true,
      })
    );
  }

  if (superSubScript) {
    marked.use(superSubScriptExtension());
  }

  if (frontMatter) {
    const { token, src: newSrc } = fm(src);
    if (token) {
      html = frontMatterRender(token);
      src = newSrc;
    }
  }

  html += marked.parse(src);

  return html;
}
