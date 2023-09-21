import { CLASS_NAMES } from "@muya/config";
import { sanitizeHyperlink } from "@muya/utils/url";
import type Renderer from "./index";
import type { SyntaxRenderOptions, AutoLinkExtensionToken } from "../types";

// render auto_link to vnode
export default function autoLinkExtension(
  this: Renderer,
  { h, block, token }: SyntaxRenderOptions & { token: AutoLinkExtensionToken }
) {
  const { linkType, www, url, email } = token;
  const { start, end } = token.range;

  const content = this.highlight(h, block, start, end, token);
  const hyperlink =
    linkType === "www"
      ? encodeURI(`http://${www}`)
      : linkType === "url"
      ? encodeURI(url)
      : `mailto:${email}`;

  return [
    h(
      `a.${CLASS_NAMES.MU_INLINE_RULE}.${CLASS_NAMES.MU_AUTO_LINK_EXTENSION}`,
      {
        attrs: {
          spellcheck: "false",
        },
        props: {
          href: sanitizeHyperlink(hyperlink),
          target: "_blank",
        },
      },
      content
    ),
  ];
}
