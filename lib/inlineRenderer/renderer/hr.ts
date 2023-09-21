import { CLASS_NAMES } from "@muya/config";
import type Renderer from "./index";
import type { SyntaxRenderOptions } from "../types";

export default function hr(
  this: Renderer,
  { h, block, token }: SyntaxRenderOptions
) {
  const { start, end } = token.range;
  const content = this.highlight(h, block, start, end, token);

  return [h(`span.${CLASS_NAMES.MU_GRAY}.${CLASS_NAMES.MU_REMOVE}`, content)];
}
