import { Lexer, marked } from "marked";
import markedKatex from "marked-katex-extension";

type LexBlockOption = {
  footnote?: boolean;
  math?: boolean;
  isGitlabCompatibilityEnabled?: boolean;
  frontMatter?: boolean;
};

const walkTokens = (options: LexBlockOption) => (token) => {
  const { math, isGitlabCompatibilityEnabled } = options;
  // marked mixes atx and setext headers, which we distinguish by headingStyle,
  // and markers are unique to setext heading
  if (token.type === "heading") {
    const matches = /\n {0,3}(=+|-+)/.exec(token.raw);
    token.headingStyle = matches ? "setext" : "atx";
    token.marker = matches ? matches[1] : "";
  }
  // Rename blockKatex to multiplemath, as multiplemath may be more accurate
  if (token.type === "blockKatex") {
    token.type = "multiplemath";
    token.mathStyle = "";
  }

  if (token.type === "code") {
    if (token.codeBlockStyle) {
      token.lang = "";
    } else if (typeof token.lang === "string") {
      token.codeBlockStyle = "fenced";
    }
    if (token.lang === "math" && math && isGitlabCompatibilityEnabled) {
      token.type = "multiplemath";
      token.mathStyle = "gitlab";
      delete token.lang;
      delete token.codeBlockStyle;
    }
  }
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
  const tokens = [];

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
  marked.walkTokens(tokens, walkTokens(options));
  console.log(JSON.stringify(tokens, null, 1));
}
