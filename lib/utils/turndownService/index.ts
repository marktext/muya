import { identity } from "@muya/utils";
import * as turndownPluginGfm from "joplin-turndown-plugin-gfm";
import type { Filter, Node } from "turndown";
import TurndownService from "turndown";

export const usePluginsAddRules = (
  turndownService: TurndownService,
  keeps: Filter
) => {
  // Use the gfm plugin
  const { strikethrough, tables  } = turndownPluginGfm;
  turndownService.use(strikethrough);
  turndownService.use(tables);

  // We need a extra strikethrough rule because the strikethrough rule in gfm is single `~`.
  turndownService.addRule("strikethrough", {
    filter: ["del", "s" /* "strike" */], // <strike> is not support by the web standard, so I remove the use `strike` in filter...
    replacement(content: string) {
      return "~~" + content + "~~";
    },
  });

  turndownService.addRule('taskListItems', {
    filter: function (node) {
      return (node as HTMLInputElement).type === 'checkbox' && node.parentNode?.nodeName === 'P'
    },
    replacement: function (_content, node) {
      return ((node as HTMLInputElement).checked ? '[x]' : '[ ]') + ' '
    }
  })

  turndownService.addRule("paragraph", {
    filter: "p",

    replacement: function (
      content: string,
      node: Node
    ) {
      const isTaskListItemParagraph =
        node instanceof HTMLElement &&
        node.firstElementChild?.tagName === "INPUT";
      return isTaskListItemParagraph
        ? content.replace(/\]\s+\n/, "] ") + "\n\n"
        : "\n\n" + content + "\n\n";
    },
  });

  turndownService.addRule("listItem", {
    filter: "li",

    replacement: function (
      content: string,
      node: Node,
      options: { bulletListMarker?: string }
    ) {
      content = content
        .replace(/^\n+/, "") // remove leading newlines
        .replace(/\n+$/, "\n") // replace trailing newlines with just a single one
        .replace(/\n/gm, "\n  "); // indent

      let prefix = options.bulletListMarker + " ";
      const parent = node.parentNode as HTMLElement;
      if (parent?.nodeName === "OL") {
        const start = parent.getAttribute("start");
        const index = Array.prototype.indexOf.call(parent.children, node);
        prefix = (start ? Number(start) + index : index + 1) + ". ";
      }

      return (
        prefix +
        content +
        (node.nextSibling && !/\n$/.test(content) ? "\n" : "")
      );
    },
  });

  // Handle multiple math lines
  turndownService.addRule("multiplemath", {
    filter(node: Node) {
      return (
        node instanceof HTMLElement &&
        node.nodeName === "PRE" &&
        node.classList.contains("multiple-math")
      );
    },
    replacement(content: string) {
      return `$$\n${content}\n$$`;
    },
  });

  turndownService.escape = identity;
  turndownService.keep(keeps);
};

export default TurndownService;
