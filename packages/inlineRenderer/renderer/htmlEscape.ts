import { CLASS_NAMES } from '@muya/config';
import escapeCharactersMap from '@muya/config/escapeCharacter';
import type Renderer from './index';
import type { SyntaxRenderOptions, HTMLEscapeToken } from '../types';

export default function htmlEscape(
  this: Renderer,
  {
    h,
    cursor,
    block,
    token,
    outerClass,
  }: SyntaxRenderOptions & { token: HTMLEscapeToken }
) {
  const className = this.getClassName(outerClass, block, token, cursor);
  const { escapeCharacter } = token;
  const { start, end } = token.range;

  const content = this.highlight(h, block, start, end, token);

  return [
    h(
      `span.${className}.${CLASS_NAMES.MU_HTML_ESCAPE}`,
      {
        dataset: {
          character: escapeCharactersMap[escapeCharacter],
        },
      },
      content
    ),
  ];
}
