import paragraphIcon from '@/assets/icons/paragraph/2.png'
import htmlIcon from '@/assets/icons/html/2.png'
import hrIcon from '@/assets/icons/horizontal_line/2.png'
import frontMatterIcon from '@/assets/icons/front_matter/2.png'
import header1Icon from '@/assets/icons/heading_1/2.png'
import header2Icon from '@/assets/icons/heading_2/2.png'
import header3Icon from '@/assets/icons/heading_3/2.png'
import header4Icon from '@/assets/icons/heading_4/2.png'
import header5Icon from '@/assets/icons/heading_5/2.png'
import header6Icon from '@/assets/icons/heading_6/2.png'
import newTableIcon from '@/assets/icons/new_table/2.png'
import bulletListIcon from '@/assets/icons/bullet_list/2.png'
import codeIcon from '@/assets/icons/code/2.png'
import quoteIcon from '@/assets/icons/quote_block/2.png'
import todoListIcon from '@/assets/icons/todolist/2.png'
import mathblockIcon from '@/assets/icons/math/2.png'
import orderListIcon from '@/assets/icons/order_list/2.png'
import flowchartIcon from '@/assets/icons/flowchart/2.png'
import sequenceIcon from '@/assets/icons/sequence/2.png'
import mermaidIcon from '@/assets/icons/mermaid/2.png'
import vegaIcon from '@/assets/icons/chart/2.png'
import { isOsx } from '@/config'

const COMMAND_KEY = isOsx ? '⌘' : 'Ctrl'
const OPTION_KEY = isOsx ? '⌥' : 'Alt'
const SHIFT_KEY = isOsx ? '⇧' : 'Shift'

// Command (or Cmd) ⌘
// Shift ⇧
// Option (or Alt) ⌥
// Control (or Ctrl) ⌃
// Caps Lock ⇪
// Fn

export const MENU_CONFIG = [
  {
    name: 'basic block',
    children: [{
      title: 'Paragraph',
      subTitle: 'Lorem Ipsum is simply dummy text',
      label: 'paragraph',
      shortCut: `${COMMAND_KEY}+0`,
      icon: paragraphIcon
    }, {
      title: 'Horizontal Line',
      subTitle: '---',
      label: 'thematic-break',
      shortCut: `${OPTION_KEY}+${COMMAND_KEY}+-`,
      icon: hrIcon
    }, {
      title: 'Front Matter',
      subTitle: '--- Lorem Ipsum ---',
      label: 'frontmatter',
      shortCut: `${OPTION_KEY}+${COMMAND_KEY}+Y`,
      icon: frontMatterIcon
    }]
  },
  {
    name: 'header',
    children: [{
      title: 'Header 1',
      subTitle: '# Lorem Ipsum is simply ...',
      label: 'atx-heading 1',
      shortCut: `${COMMAND_KEY}+1`,
      icon: header1Icon
    }, {
      title: 'Header 2',
      subTitle: '## Lorem Ipsum is simply ...',
      label: 'atx-heading 2',
      shortCut: `${COMMAND_KEY}+2`,
      icon: header2Icon
    }, {
      title: 'Header 3',
      subTitle: '### Lorem Ipsum is simply ...',
      label: 'atx-heading 3',
      shortCut: `${COMMAND_KEY}+3`,
      icon: header3Icon
    }, {
      title: 'Header 4',
      subTitle: '#### Lorem Ipsum is simply ...',
      label: 'atx-heading 4',
      shortCut: `${COMMAND_KEY}+4`,
      icon: header4Icon
    }, {
      title: 'Header 5',
      subTitle: '##### Lorem Ipsum is simply ...',
      label: 'atx-heading 5',
      shortCut: `${COMMAND_KEY}+5`,
      icon: header5Icon
    }, {
      title: 'Header 6',
      subTitle: '###### Lorem Ipsum is simply ...',
      label: 'atx-heading 6',
      shortCut: `${COMMAND_KEY}+6`,
      icon: header6Icon
    }]
  }, {
    name: 'advanced block',
    children: [{
      title: 'Table Block',
      subTitle: '|Lorem | Ipsum is simply |',
      label: 'table',
      shortCut: `${SHIFT_KEY}+${COMMAND_KEY}+T`,
      icon: newTableIcon
    }, {
      title: 'Display Math',
      subTitle: '$$ Lorem Ipsum is simply $$',
      label: 'math-block',
      shortCut: `${OPTION_KEY}+${COMMAND_KEY}+M`,
      icon: mathblockIcon
    }, {
      title: 'HTML Block',
      subTitle: '<div> Lorem Ipsum is simply </div>',
      label: 'html-block',
      shortCut: `${OPTION_KEY}+${COMMAND_KEY}+J`,
      icon: htmlIcon
    }, {
      title: 'Code Block',
      subTitle: '```java Lorem Ipsum is simply ```',
      label: 'code-block',
      shortCut: `${OPTION_KEY}+${COMMAND_KEY}+C`,
      icon: codeIcon
    }, {
      title: 'Quote Block',
      subTitle: '>Lorem Ipsum is simply ...',
      label: 'block-quote',
      shortCut: `${OPTION_KEY}+${COMMAND_KEY}+Q`,
      icon: quoteIcon
    }]
  }, {
    name: 'list block',
    children: [{
      title: 'Order List',
      subTitle: '1. Lorem Ipsum is simply ...',
      label: 'order-list',
      shortCut: `${OPTION_KEY}+${COMMAND_KEY}+O`,
      icon: orderListIcon
    }, {
      title: 'Bullet List',
      subTitle: '- Lorem Ipsum is simply ...',
      label: 'bullet-list',
      shortCut: `${OPTION_KEY}+${COMMAND_KEY}+U`,
      icon: bulletListIcon
    }, {
      title: 'To-do List',
      subTitle: '- [x] Lorem Ipsum is simply ...',
      label: 'task-list',
      shortCut: `${OPTION_KEY}+${COMMAND_KEY}+X`,
      icon: todoListIcon
    }]
  },
  {
    name: 'diagram',
    children: [{
      title: 'Vega Chart',
      subTitle: 'Render flow chart by vega-lite.js.',
      label: 'diagram vega-lite',
      icon: vegaIcon
    }, {
      title: 'Flow Chart',
      subTitle: 'Render flow chart by flowchart.js.',
      label: 'diagram flowchart',
      icon: flowchartIcon
    }, {
      title: 'Sequence Diagram',
      subTitle: 'Render sequence diagram by js-sequence.',
      label: 'diagram sequence',
      icon: sequenceIcon
    }, {
      title: 'Mermaid',
      subTitle: 'Render Diagram by mermaid.',
      label: 'diagram mermaid',
      icon: mermaidIcon
    }]
  }
]
