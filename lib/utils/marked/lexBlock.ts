import { Lexer, marked } from "marked";
import markedKatex from "marked-katex-extension";
import compatibleTaskList from "./compatibleTaskList";
import walkTokens from "./walkTokens";

type LexBlockOption = {
  footnote?: boolean;
  math?: boolean;
  isGitlabCompatibilityEnabled?: boolean;
  frontMatter?: boolean;
};

const DEFAULT_OPTIONS = {
  footnote: false,
  math: true,
  isGitlabCompatibilityEnabled: true,
  frontMatter: true,
};

const FRONT_REG =
  /^(?:(?:---\n([\s\S]+?)---)|(?:\+\+\+\n([\s\S]+?)\+\+\+)|(?:;;;\n([\s\S]+?);;;)|(?:\{\n([\s\S]+?)\}))(?:\n{2,}|\n{1,2}$)/;
const STYLE_LANG = {
  "-": "yaml",
  "+": "toml",
  ";": "json",
  "{": "json",
};

export function lexBlock(
  src: string,
  options: LexBlockOption = DEFAULT_OPTIONS
) {
  options = Object.assign({}, DEFAULT_OPTIONS, options);
  const { math, frontMatter } = options;
  let tokens = [];

  if (math) {
    marked.use(
      markedKatex({
        throwOnError: false,
      })
    );
  }

  if (frontMatter) {
    const matches = FRONT_REG.exec(src);
    if (matches) {
      const raw = matches[0];
      const style = raw[0] as keyof typeof STYLE_LANG;
      const lang = STYLE_LANG[style];

      tokens.push({
        type: "frontmatter",
        raw,
        text: matches[1],
        style,
        lang,
      });

      src = src.substring(raw.length);
    }
  }

  tokens.push(...new Lexer().blockTokens(src));
  tokens = compatibleTaskList(tokens);
  marked.walkTokens(tokens, walkTokens(options));

  return tokens;
}
