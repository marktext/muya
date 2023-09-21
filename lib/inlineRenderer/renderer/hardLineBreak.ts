import { CLASS_NAMES } from "@muya/config";
import type Renderer from "./index";
import type { SyntaxRenderOptions, HardLineBreakToken } from "../types";

export default function hardLineBreak(
  this: Renderer,
  { h, token }: SyntaxRenderOptions & { token: HardLineBreakToken }
) {
  const { spaces, lineBreak, isAtEnd } = token;
  const className = CLASS_NAMES.MU_HARD_LINE_BREAK;
  const spaceClass = CLASS_NAMES.MU_HARD_LINE_BREAK_SPACE;
  if (isAtEnd) {
    return [
      h(`span.${className}`, h(`span.${spaceClass}`, spaces)),
      h(`span.${CLASS_NAMES.MU_LINE_END}`, lineBreak),
    ];
  } else {
    return [
      h(`span.${className}`, [h(`span.${spaceClass}`, spaces), lineBreak]),
    ];
  }
}
