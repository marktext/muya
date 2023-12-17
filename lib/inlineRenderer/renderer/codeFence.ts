import { CLASS_NAMES } from '@muya/config';
import type Renderer from './index';
import type { SyntaxRenderOptions, BeginRuleToken } from '../types';

// Use to render ```
export default function codeFence(
  this: Renderer,
  { h, block, token }: SyntaxRenderOptions & { token: BeginRuleToken }
) {
  const { start, end } = token.range;
  const { marker } = token;

  const markerContent = this.highlight(
    h,
    block,
    start,
    start + marker.length,
    token
  );
  const content = this.highlight(h, block, start + marker.length, end, token);

  return [
    h(`span.${CLASS_NAMES.MU_GRAY}`, markerContent),
    h(
      `span.${CLASS_NAMES.MU_LANGUAGE}`,
      {
        attrs: {
          spellcheck: 'false',
        },
      },
      content
    ),
  ];
}
