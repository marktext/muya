import type Renderer from './index';
import type { SyntaxRenderOptions, StrongEmToken } from '../types';

export default function strong(
  this: Renderer,
  { h, cursor, block, token, outerClass }: SyntaxRenderOptions & { token: StrongEmToken }
) {
  return this.delEmStrongFac('strong', {
    h,
    cursor,
    block,
    token,
    outerClass,
  });
}
