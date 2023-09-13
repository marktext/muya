// @ts-nocheck
import { CLASS_NAMES } from "@muya/config";

export default function codeFence(h, cursor, block, token, outerClass) {
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
          spellcheck: "false",
        },
      },
      content
    ),
  ];
}
