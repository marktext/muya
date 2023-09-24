import bulletListIcon from "@muya/assets/icons/bullet_list/2.png";
import vegaIcon from "@muya/assets/icons/chart/2.png";
import codeIcon from "@muya/assets/icons/code/2.png";
import flowchartIcon from "@muya/assets/icons/flowchart/2.png";
import frontMatterIcon from "@muya/assets/icons/front_matter/2.png";
import header1Icon from "@muya/assets/icons/heading_1/2.png";
import header2Icon from "@muya/assets/icons/heading_2/2.png";
import header3Icon from "@muya/assets/icons/heading_3/2.png";
import header4Icon from "@muya/assets/icons/heading_4/2.png";
import header5Icon from "@muya/assets/icons/heading_5/2.png";
import header6Icon from "@muya/assets/icons/heading_6/2.png";
import hrIcon from "@muya/assets/icons/horizontal_line/2.png";
import htmlIcon from "@muya/assets/icons/html/2.png";
import mathBlockIcon from "@muya/assets/icons/math/2.png";
import mermaidIcon from "@muya/assets/icons/mermaid/2.png";
import newTableIcon from "@muya/assets/icons/new_table/2.png";
import orderListIcon from "@muya/assets/icons/order_list/2.png";
import paragraphIcon from "@muya/assets/icons/paragraph/2.png";
import plantumlIcon from "@muya/assets/icons/plantuml/2.png";
import quoteIcon from "@muya/assets/icons/quote_block/2.png";
import sequenceIcon from "@muya/assets/icons/sequence/2.png";
import todoListIcon from "@muya/assets/icons/todolist/2.png";
import { isOsx } from "@muya/config";

import ScrollPage from "@muya/block/scrollPage";
import emptyStates from "@muya/config/emptyStates";
import { deepClone } from "@muya/utils";

import logger from "@muya/utils/logger";
const debug = logger("quickInsert:");

const COMMAND_KEY = isOsx ? "⌘" : "Ctrl";
const OPTION_KEY = isOsx ? "⌥" : "Alt";
const SHIFT_KEY = isOsx ? "⇧" : "Shift";

// Command (or Cmd) ⌘
// Shift ⇧
// Option (or Alt) ⌥
// Control (or Ctrl) ⌃
// Caps Lock ⇪
// Fn

export const MENU_CONFIG = [
  {
    name: "basic blocks",
    children: [
      {
        title: "Paragraph",
        subTitle: "Lorem Ipsum text",
        label: "paragraph",
        shortCut: `${COMMAND_KEY}+0`,
        shortKeyMap: {
          altKey: false,
          shiftKey: false,
          metaKey: true,
          code: "Digit0",
        },
        icon: paragraphIcon,
      },
      {
        title: "Horizontal Line",
        subTitle: "---",
        label: "thematic-break",
        shortCut: `${OPTION_KEY}+${COMMAND_KEY}+-`,
        shortKeyMap: {
          altKey: true,
          shiftKey: false,
          metaKey: true,
          code: "Minus",
        },
        icon: hrIcon,
      },
      {
        title: "Front Matter",
        subTitle: "--- Lorem Ipsum ---",
        label: "frontmatter",
        shortCut: `${OPTION_KEY}+${COMMAND_KEY}+Y`,
        shortKeyMap: {
          altKey: true,
          shiftKey: false,
          metaKey: true,
          code: "KeyY",
        },
        icon: frontMatterIcon,
      },
    ],
  },
  {
    name: "headers",
    children: [
      {
        title: "Header 1",
        subTitle: "# Lorem Ipsum...",
        label: "atx-heading 1",
        shortCut: `${COMMAND_KEY}+1`,
        shortKeyMap: {
          altKey: false,
          shiftKey: false,
          metaKey: true,
          code: "Digit1",
        },
        icon: header1Icon,
      },
      {
        title: "Header 2",
        subTitle: "## Lorem Ipsum...",
        label: "atx-heading 2",
        shortCut: `${COMMAND_KEY}+2`,
        shortKeyMap: {
          altKey: false,
          shiftKey: false,
          metaKey: true,
          code: "Digit2",
        },
        icon: header2Icon,
      },
      {
        title: "Header 3",
        subTitle: "### Lorem Ipsum...",
        label: "atx-heading 3",
        shortCut: `${COMMAND_KEY}+3`,
        shortKeyMap: {
          altKey: false,
          shiftKey: false,
          metaKey: true,
          code: "Digit3",
        },
        icon: header3Icon,
      },
      {
        title: "Header 4",
        subTitle: "#### Lorem Ipsum...",
        label: "atx-heading 4",
        shortCut: `${COMMAND_KEY}+4`,
        shortKeyMap: {
          altKey: false,
          shiftKey: false,
          metaKey: true,
          code: "Digit4",
        },
        icon: header4Icon,
      },
      {
        title: "Header 5",
        subTitle: "##### Lorem Ipsum...",
        label: "atx-heading 5",
        shortCut: `${COMMAND_KEY}+5`,
        shortKeyMap: {
          altKey: false,
          shiftKey: false,
          metaKey: true,
          code: "Digit5",
        },
        icon: header5Icon,
      },
      {
        title: "Header 6",
        subTitle: "###### Lorem Ipsum...",
        label: "atx-heading 6",
        shortCut: `${COMMAND_KEY}+6`,
        shortKeyMap: {
          altKey: false,
          shiftKey: false,
          metaKey: true,
          code: "Digit6",
        },
        icon: header6Icon,
      },
    ],
  },
  {
    name: "advanced blocks",
    children: [
      {
        title: "Table Block",
        subTitle: "|Lorem | Ipsum |",
        label: "table",
        // no
        shortCut: `${SHIFT_KEY}+${COMMAND_KEY}+T`,
        shortKeyMap: {
          altKey: false,
          shiftKey: true,
          metaKey: true,
          code: "KeyT",
        },
        icon: newTableIcon,
      },
      {
        title: "Display Math",
        subTitle: "$$ Lorem Ipsum $$",
        label: "math-block",
        shortCut: `${OPTION_KEY}+${COMMAND_KEY}+M`,
        shortKeyMap: {
          altKey: true,
          shiftKey: false,
          metaKey: true,
          code: "KeyM",
        },
        icon: mathBlockIcon,
      },
      {
        title: "HTML Block",
        subTitle: "<div> Lorem Ipsum </div>",
        label: "html-block",
        shortCut: `${OPTION_KEY}+${COMMAND_KEY}+J`,
        shortKeyMap: {
          altKey: true,
          shiftKey: false,
          metaKey: true,
          code: "KeyJ",
        },
        icon: htmlIcon,
      },
      {
        title: "Code Block",
        subTitle: "```java Lorem Ipsum ```",
        label: "code-block",
        shortCut: `${OPTION_KEY}+${COMMAND_KEY}+C`,
        shortKeyMap: {
          altKey: true,
          shiftKey: false,
          metaKey: true,
          code: "KeyC",
        },
        icon: codeIcon,
      },
      {
        title: "Quote Block",
        subTitle: ">Lorem Ipsum ...",
        label: "block-quote",
        // no
        shortCut: `${OPTION_KEY}+${COMMAND_KEY}+Q`,
        shortKeyMap: {
          altKey: true,
          shiftKey: false,
          metaKey: true,
          code: "KeyQ",
        },
        icon: quoteIcon,
      },
    ],
  },
  {
    name: "list blocks",
    children: [
      {
        title: "Order List",
        subTitle: "1. Lorem Ipsum ...",
        label: "order-list",
        shortCut: `${OPTION_KEY}+${COMMAND_KEY}+O`,
        shortKeyMap: {
          altKey: true,
          shiftKey: false,
          metaKey: true,
          code: "KeyO",
        },
        icon: orderListIcon,
      },
      {
        title: "Bullet List",
        subTitle: "- Lorem Ipsum ...",
        label: "bullet-list",
        shortCut: `${OPTION_KEY}+${COMMAND_KEY}+U`,
        shortKeyMap: {
          altKey: true,
          shiftKey: false,
          metaKey: true,
          code: "KeyU",
        },
        icon: bulletListIcon,
      },
      {
        title: "To-do List",
        subTitle: "- [x] Lorem Ipsum ...",
        label: "task-list",
        shortCut: `${OPTION_KEY}+${COMMAND_KEY}+X`,
        shortKeyMap: {
          altKey: true,
          shiftKey: false,
          metaKey: true,
          code: "KeyX",
        },
        icon: todoListIcon,
      },
    ],
  },
  {
    name: "diagrams",
    children: [
      {
        title: "Vega Chart",
        subTitle: "By vega-lite.js",
        label: "diagram vega-lite",
        icon: vegaIcon,
      },
      {
        title: "Flow Chart",
        subTitle: "By flowchart.js",
        label: "diagram flowchart",
        icon: flowchartIcon,
      },
      {
        title: "Sequence",
        subTitle: "By js-sequence",
        label: "diagram sequence",
        icon: sequenceIcon,
      },
      {
        title: "Mermaid",
        subTitle: "By mermaid",
        label: "diagram mermaid",
        icon: mermaidIcon,
      },
      {
        title: "Plantuml",
        subTitle: "By plantuml",
        label: "diagram plantuml",
        icon: plantumlIcon,
      },
    ],
  },
];

export type QuickInsertMenuItem = typeof MENU_CONFIG[number];

export const getLabelFromEvent = (event) => {
  const ALL_MENU_CONFIG = MENU_CONFIG.reduce(
    (acc, section) => [...acc, ...section.children],
    []
  );

  const result = ALL_MENU_CONFIG.find((menu) => {
    const { code, metaKey, shiftKey, altKey } = event;
    const { shortKeyMap = {} } = menu;

    return (
      code === shortKeyMap.code &&
      metaKey === shortKeyMap.metaKey &&
      shiftKey === shortKeyMap.shiftKey &&
      altKey === shortKeyMap.altKey
    );
  });

  if (result) {
    return result.label;
  }
};

export const replaceBlockByLabel = ({ block, muya, label, text = "" }) => {
  const {
    preferLooseListItem,
    bulletListMarker,
    orderListDelimiter,
    frontmatterType,
  } = muya.options;
  let newBlock = null;
  let state = null;
  let cursorBlock = null;

  switch (label) {
    case "paragraph":

    case "thematic-break":

    case "table":

    case "math-block":

    case "html-block":

    case "code-block":

    case "block-quote":
      state = deepClone(emptyStates[label]);
      if (label === "paragraph") {
        state.text = text;
      } else if (label === "block-quote") {
        state.children[0].text = text;
      }
      newBlock = ScrollPage.loadBlock(label).create(muya, state);
      break;

    case "frontmatter":
      state = deepClone(emptyStates.frontmatter);
      state.meta.type = frontmatterType;
      state.meta.lang = /\+-/.test(frontmatterType) ? "yaml" : "json";
      newBlock = ScrollPage.loadBlock(label).create(muya, state);
      break;

    case "atx-heading 1":

    case "atx-heading 2":

    case "atx-heading 3":

    case "atx-heading 4":

    case "atx-heading 5":

    case "atx-heading 6":
      state = deepClone(emptyStates["atx-heading"]);
      // eslint-disable-next-line no-case-declarations
      const [blockName, level] = label.split(" ");
      state.meta.level = level;
      state.text = "#".repeat(+level) + " " + text;
      newBlock = ScrollPage.loadBlock(blockName).create(muya, state);
      break;

    case "order-list":
      state = deepClone(emptyStates[label]);
      state.meta.loose = preferLooseListItem;
      state.meta.delimiter = orderListDelimiter;
      if (text) {
        state.children[0].children[0].text = text;
      }
      newBlock = ScrollPage.loadBlock(label).create(muya, state);
      break;

    case "bullet-list":

    case "task-list":
      state = deepClone(emptyStates[label]);
      state.meta.loose = preferLooseListItem;
      state.meta.marker = bulletListMarker;
      if (text) {
        state.children[0].children[0].text = text;
      }
      newBlock = ScrollPage.loadBlock(label).create(muya, state);
      break;

    case "diagram vega-lite":

    case "diagram flowchart":

    case "diagram sequence":

    case "diagram mermaid":

    case "diagram plantuml":
      state = deepClone(emptyStates.diagram);
      // eslint-disable-next-line no-case-declarations
      const [name, type] = label.split(" ");
      state.meta.type = type;
      state.meta.lang = type === "vega-lite" ? "json" : "ymal";
      newBlock = ScrollPage.loadBlock(name).create(muya, state);
      break;

    default:
      debug.log("Unknown label in quick insert");
      break;
  }

  block.replaceWith(newBlock);
  if (label === "thematic-break") {
    const nextParagraphBlock = ScrollPage.loadBlock("paragraph").create(
      muya,
      deepClone(emptyStates.paragraph)
    );
    newBlock.parent.insertAfter(nextParagraphBlock, newBlock);
    cursorBlock = nextParagraphBlock.firstContentInDescendant();
    cursorBlock.setCursor(0, 0, true);
  } else {
    cursorBlock = newBlock.firstContentInDescendant();
    // Set the cursor between <div>\n\n</div> when create html-block
    const offset = label === "html-block" ? 6 : cursorBlock.text.length;
    cursorBlock.setCursor(offset, offset, true);
  }
};
