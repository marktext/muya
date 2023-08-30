import { union, isEven } from "@muya/utils";
import { CLASS_NAMES } from "@muya/config";

// TODO HIGHLIGHT
export default function backlashInToken(
  h,
  backlashes,
  outerClass,
  start,
  token
) {
  const { highlights = [] } = token;
  const chunks = backlashes.split("");
  const len = chunks.length;
  const result = [];
  let i;

  for (i = 0; i < len; i++) {
    const chunk = chunks[i];
    const light = highlights.filter((light) =>
      union({ start: start + i, end: start + i + 1 }, light)
    );
    let selector = "span";
    if (light.length) {
      const className = this.getHighlightClassName(light[0].active);
      selector += `.${className}`;
    }

    if (isEven(i)) {
      result.push(h(`${selector}.${outerClass}`, chunk));
    } else {
      result.push(h(`${selector}.${CLASS_NAMES.MU_BACKLASH}`, chunk));
    }
  }

  return result;
}
