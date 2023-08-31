import { CLASS_NAMES } from "@muya/config";

export default function softLineBreak(h, cursor, block, token, outerClass) {
  const { lineBreak, isAtEnd } = token;
  let selector = `span.${CLASS_NAMES.MU_SOFT_LINE_BREAK}`;
  if (isAtEnd) {
    selector += `.${CLASS_NAMES.MU_LINE_END}`;
  }

  return [h(selector, lineBreak)];
}
