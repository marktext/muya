import { Lexer, marked } from "marked";
import compatibleTaskList from "./compatibleTaskList";
import mathExtension from "./extensions/math";
import fm from "./frontMatter";
import { DEFAULT_OPTIONS } from "./options";
import type { LexOption } from "./types";
import walkTokens from "./walkTokens";

export function lexBlock(
  src: string,
  options: LexOption = DEFAULT_OPTIONS
) {
  options = Object.assign({}, DEFAULT_OPTIONS, options);
  const { math, frontMatter } = options;
  let tokens = [];

  if (math) {
    marked.use(
      mathExtension({
        throwOnError: false,
        useKatexRender: false,
      })
    );
  }

  if (frontMatter) {
    const { token, src: newSrc } = fm(src);
    if (token) {
      tokens.push(token);
      src = newSrc;
    }
  }

  tokens.push(...new Lexer().blockTokens(src));
  tokens = compatibleTaskList(tokens);
  marked.walkTokens(tokens, walkTokens(options));

  return tokens;
}
