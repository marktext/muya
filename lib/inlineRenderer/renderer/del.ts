import type Renderer from "./index";
import type { SyntaxRenderOptions, DelToken } from "../types";

export default function del(
  this: Renderer,
  { h, cursor, block, token, outerClass }: SyntaxRenderOptions & { token: DelToken }
) {
  return this.delEmStrongFac("del", {
    h,
    cursor,
    block,
    token,
    outerClass,
  });
}
