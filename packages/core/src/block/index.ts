import ScrollPage from './scrollPage';
// leaf block
import Paragraph from './commonMark/paragraph';
import AtxHeading from './commonMark/atxHeading';
import SetextHeading from './commonMark/setextHeading';
import ThematicBreak from './commonMark/thematicBreak';
import CodeBlock from './commonMark/codeBlock';
import Code from './commonMark/codeBlock/code';
import Table from './gfm/table';
import TableInner from './gfm/table/table';
import TableRow from './gfm/table/row';
import Cell from './gfm/table/cell';
import HTMLBlock from './commonMark/html';
import HTMLContainer from './commonMark/html/htmlContainer';
import MathBlock from './extra/math';
import MathContainer from './extra/math/mathContainer';
import Frontmatter from './/extra/frontmatter';
import DiagramBlock from './extra/diagram';
import DiagramContainer from './extra/diagram/diagramContainer';
// container block
import BlockQuote from './commonMark/blockQuote';
import OrderList from './commonMark/orderList';
import ListItem from './commonMark/listItem';
import BulletList from './commonMark/bulletList';
import TaskList from './gfm/taskList';
import TaskListItem from './gfm/taskListItem';
// content
import ParagraphContent from './content/paragraphContent';
import AtxHeadingContent from './content/atxHeadingContent';
import SetextHeadingContent from './content/setextHeadingContent';
import ThematicBreakContent from './content/thematicBreakContent';
import LangInputContent from './content/langInputContent';
import CodeBlockContent from './content/codeBlockContent';
import TableCellContent from './content/tableCell';
// Attachment Block
import TaskListCheckbox from './gfm/taskListCheckbox';
import HTMLPreview from './commonMark/html/htmlPreview';
import MathPreview from './extra/math/mathPreview';
import DiagramPreview from './extra/diagram/diagramPreview';

// Register itself
ScrollPage.register(ScrollPage);
ScrollPage.register(Paragraph);
ScrollPage.register(ParagraphContent);
ScrollPage.register(AtxHeading);
ScrollPage.register(AtxHeadingContent);
ScrollPage.register(SetextHeading);
ScrollPage.register(SetextHeadingContent);
ScrollPage.register(BlockQuote);
ScrollPage.register(ThematicBreak);
ScrollPage.register(ThematicBreakContent);
ScrollPage.register(CodeBlock);
ScrollPage.register(Code);
ScrollPage.register(LangInputContent);
ScrollPage.register(CodeBlockContent);
ScrollPage.register(OrderList);
ScrollPage.register(ListItem);
ScrollPage.register(BulletList);
ScrollPage.register(TaskList);
ScrollPage.register(TaskListItem);
ScrollPage.register(TaskListCheckbox);
// Table
ScrollPage.register(Table);
ScrollPage.register(TableInner);
ScrollPage.register(TableRow);
ScrollPage.register(Cell);
ScrollPage.register(TableCellContent);
// HTML
ScrollPage.register(HTMLBlock);
ScrollPage.register(HTMLPreview);
ScrollPage.register(HTMLContainer);
// Math
ScrollPage.register(MathBlock);
ScrollPage.register(MathPreview);
ScrollPage.register(MathContainer);
// FrontMatter
ScrollPage.register(Frontmatter);
// Diagram
ScrollPage.register(DiagramBlock);
ScrollPage.register(DiagramContainer);
ScrollPage.register(DiagramPreview);

const ScrollPageForExport = ScrollPage;

export default ScrollPageForExport;
