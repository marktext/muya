import type { Token } from "prismjs";

type TempTextToken = {
  type: "temp-text";
  content: string;
  length: number;
};

export function walkTokens(
  tokens: (string | Token)[],
  cb: (t: TempTextToken | Token) => void
) {
  for (const token of tokens) {
    if (typeof token === "string") {
      cb({ type: "temp-text", content: token, length: token.length });
    } else if (typeof token.content === "string") {
      cb(token);
    } else {
      walkTokens(
        Array.isArray(token.content) ? token.content : [token.content],
        cb
      );
    }
  }
}
