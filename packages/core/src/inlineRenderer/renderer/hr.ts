import { CLASS_NAMES } from '../../config';
import type { ISyntaxRenderOptions } from '../types';
import type Renderer from './index';

export default function hr(
    this: Renderer,
    { h, block, token }: ISyntaxRenderOptions,
) {
    const { start, end } = token.range;
    const content = this.highlight(h, block, start, end, token);

    return [h(`span.${CLASS_NAMES.MU_GRAY}.${CLASS_NAMES.MU_REMOVE}`, content)];
}
