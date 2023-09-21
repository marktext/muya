import type Renderer from "./index";
import type { SyntaxRenderOptions } from "../types";

// render token of text type to vnode.
export default function text(
  this: Renderer,
  { h, block, token }: SyntaxRenderOptions
) {
  const { start, end } = token.range;

  return [h("span.mu-plain-text", this.highlight(h, block, start, end, token))];
}
