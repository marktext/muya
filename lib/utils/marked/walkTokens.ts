import type { LexOption } from "./types";

const walkTokens = (options: LexOption) => (token) => {
  const { math, isGitlabCompatibilityEnabled } = options;
  // marked mixes atx and setext headers, which we distinguish by headingStyle,
  // and markers are unique to setext heading
  if (token.type === "heading") {
    const matches = /\n {0,3}(=+|-+)/.exec(token.raw);
    token.headingStyle = matches ? "setext" : "atx";
    token.marker = matches ? matches[1] : "";
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
      token.displayMode = true;
      delete token.lang;
      delete token.codeBlockStyle;
    }
  }
};

export default walkTokens;
