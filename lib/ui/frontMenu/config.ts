import copyIcon from "@muya/assets/icons/copy/2.png";
import newIcon from "@muya/assets/icons/paragraph/2.png";
import deleteIcon from "@muya/assets/icons/delete/2.png";
import { MENU_CONFIG } from "@muya/ui/quickInsert/config";
import { isOsx } from "@muya/config";

const ALL_MENU_CONFIG = MENU_CONFIG.reduce(
  (acc, section) => [...acc, ...section.children],
  []
);
const COMMAND_KEY = isOsx ? "⌘" : "⌃";

export const FRONT_MENU = [
  {
    icon: copyIcon,
    label: "duplicate",
    text: "Duplicate",
    shortCut: `⇧${COMMAND_KEY}P`,
  },
  {
    icon: newIcon,
    label: "new",
    text: "New Paragraph",
    shortCut: `⇧${COMMAND_KEY}N`,
  },
  {
    icon: deleteIcon,
    label: "delete",
    text: "Delete",
    shortCut: `⇧${COMMAND_KEY}D`,
  },
];

export const canTurnIntoMenu = (block) => {
  const { blockName } = block;

  switch (blockName) {
    case "paragraph": {
      const isEmpty = /^\s*$/.test(block.firstContentInDescendant().text);
      if (isEmpty) {
        return ALL_MENU_CONFIG.filter((item) => item.label !== "frontmatter");
      }

      const PARAGRAPH_TURN_INTO_REG =
        /paragraph|atx-heading|block-quote|order-list|bullet-list|task-list/;

      return ALL_MENU_CONFIG.filter((item) =>
        PARAGRAPH_TURN_INTO_REG.test(item.label)
      );
    }

    case "atx-heading": {
      return ALL_MENU_CONFIG.filter((item) =>
        /atx-heading|paragraph/.test(item.label)
      );
    }

    case "order-list":

    case "bullet-list":

    case "task-list": {
      return ALL_MENU_CONFIG.filter((item) =>
        /order-list|bullet-list|task-list/.test(item.label)
      );
    }

    default:
      return [];
  }
};
