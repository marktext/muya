import { CLASS_NAMES } from "@muya/config";

export default function header(h, cursor, block, token, outerClass) {
  const { content } = token;
  const { start, end } = token.range;
  const className = this.getClassName(
    outerClass,
    block,
    {
      range: {
        start,
        end: end - content.length,
      },
    },
    cursor
  );
  const markerVnode = this.highlight(
    h,
    block,
    start,
    end - content.length,
    token
  );
  const contentVnode = this.highlight(
    h,
    block,
    end - content.length,
    end,
    token
  );
  const spaceSelector =
    className === CLASS_NAMES.MU_HIDE
      ? `span.${CLASS_NAMES.MU_HEADER_TIGHT_SPACE}.${CLASS_NAMES.MU_REMOVE}`
      : `span.${CLASS_NAMES.MU_GRAY}.${CLASS_NAMES.MU_REMOVE}`;

  return [
    h(`span.${className}.${CLASS_NAMES.MU_REMOVE}`, markerVnode),
    h(spaceSelector, contentVnode),
  ];
}
