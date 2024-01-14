import type Renderer from './index';
import type { SyntaxRenderOptions, StrongEmToken } from '../types';

export default function em(
  this: Renderer,
  { h, cursor, block, token, outerClass }: SyntaxRenderOptions & { token: StrongEmToken }
) {
  return this.delEmStrongFac('em', {
    h,
    cursor,
    block,
    token,
    outerClass,
  });
}
