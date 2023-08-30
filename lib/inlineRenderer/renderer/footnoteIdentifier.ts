import { CLASS_NAMES } from "@muya/config";

export default function footnoteIdentifier(
  h,
  cursor,
  block,
  token,
  outerClass
) {
  const className = this.getClassName(outerClass, block, token, cursor);
  const { marker } = token;
  const { start, end } = token.range;

  const startMarker = this.highlight(
    h,
    block,
    start,
    start + marker.length,
    token
  );
  const endMarker = this.highlight(h, block, end - 1, end, token);
  const content = this.highlight(
    h,
    block,
    start + marker.length,
    end - 1,
    token
  );

  return [
    h(
      `sup#noteref-${token.content}.${CLASS_NAMES.MU_INLINE_FOOTNOTE_IDENTIFIER}.${CLASS_NAMES.MU_INLINE_RULE}`,
      [
        h(`span.${className}.${CLASS_NAMES.MU_REMOVE}`, startMarker),
        h(
          "a",
          {
            attrs: {
              spellcheck: "false",
            },
          },
          content
        ),
        h(`span.${className}.${CLASS_NAMES.MU_REMOVE}`, endMarker),
      ]
    ),
  ];
}
