import { CLASS_NAMES } from "@muya/config";
import { snakeToCamel } from "@muya/utils";

// render factory of `del`,`em`,`strong`
export default function delEmStrongFac(
  type,
  h,
  cursor,
  block,
  token,
  outerClass
) {
  const className = this.getClassName(outerClass, block, token, cursor);
  const COMMON_MARKER = `span.${className}.${CLASS_NAMES.MU_REMOVE}`;
  const { marker } = token;
  const { start, end } = token.range;
  const backlashStart = end - marker.length - token.backlash.length;
  const content = [
    ...token.children.reduce((acc, to) => {
      const chunk = this[snakeToCamel(to.type)](
        h,
        cursor,
        block,
        to,
        className
      );

      return Array.isArray(chunk) ? [...acc, ...chunk] : [...acc, chunk];
    }, []),
    ...this.backlashInToken(h, token.backlash, className, backlashStart, token),
  ];
  const startMarker = this.highlight(
    h,
    block,
    start,
    start + marker.length,
    token
  );
  const endMarker = this.highlight(h, block, end - marker.length, end, token);

  return [
    h(COMMON_MARKER, startMarker),
    h(`${type}.${CLASS_NAMES.MU_INLINE_RULE}`, content),
    h(COMMON_MARKER, endMarker),
  ];
}
