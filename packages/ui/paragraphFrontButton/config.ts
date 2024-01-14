import bulletListIcon from '@muya/assets/icons/bullet_list/2.png';
import vegaIcon from '@muya/assets/icons/chart/2.png';
import codeIcon from '@muya/assets/icons/code/2.png';
import frontMatterIcon from '@muya/assets/icons/front_matter/2.png';
import header1Icon from '@muya/assets/icons/heading_1/2.png';
import header2Icon from '@muya/assets/icons/heading_2/2.png';
import header3Icon from '@muya/assets/icons/heading_3/2.png';
import header4Icon from '@muya/assets/icons/heading_4/2.png';
import header5Icon from '@muya/assets/icons/heading_5/2.png';
import header6Icon from '@muya/assets/icons/heading_6/2.png';
import thematicBreakIcon from '@muya/assets/icons/horizontal_line/2.png';
import htmlIcon from '@muya/assets/icons/html/2.png';
import mathBlockIcon from '@muya/assets/icons/math/2.png';
import mermaidIcon from '@muya/assets/icons/mermaid/2.png';
import tableIcon from '@muya/assets/icons/new_table/2.png';
import orderListIcon from '@muya/assets/icons/order_list/2.png';
import paragraphIcon from '@muya/assets/icons/paragraph/2.png';
import plantumlIcon from '@muya/assets/icons/plantuml/2.png';
import quoteIcon from '@muya/assets/icons/quote_block/2.png';
import taskListIcon from '@muya/assets/icons/todolist/2.png';
import Parent from '@muya/block/base/parent';
import AtxHeading from '@muya/block/commonMark/atxHeading';
import SetextHeading from '@muya/block/commonMark/setextHeading';
import DiagramBlock from '@muya/block/extra/diagram';

const HEADING_ICONS = [
  header1Icon,
  header2Icon,
  header3Icon,
  header4Icon,
  header5Icon,
  header6Icon,
];

const DIAGRAM_ICONS = {
  plantuml: plantumlIcon,
  mermaid: mermaidIcon,
  'vega-lite': vegaIcon,
};

export const getIcon = (block: Parent) => {
  const { blockName } = block;
  switch (blockName) {
    case 'frontmatter':
      return frontMatterIcon;

    case 'paragraph':
      return paragraphIcon;

    case 'block-quote':
      return quoteIcon;

    case 'bullet-list':
      return bulletListIcon;

    case 'order-list':
      return orderListIcon;

    case 'task-list':
      return taskListIcon;

    case 'code-block':
      return codeIcon;

    case 'atx-heading':
      return HEADING_ICONS[(block as AtxHeading).meta.level - 1];

    case 'setext-heading':
      return HEADING_ICONS[(block as SetextHeading).meta.level - 1];

    case 'thematic-break':
      return thematicBreakIcon;

    case 'table':
      return tableIcon;

    case 'html-block':
      return htmlIcon;

    case 'math-block':
      return mathBlockIcon;

    case 'diagram':
      return DIAGRAM_ICONS[(block as DiagramBlock).meta.type];

    default:
      return paragraphIcon;
  }
};
