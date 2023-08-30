import ScrollPage from "@muya/block/scrollPage";
// leaf block
import Paragraph from "@muya/block/commonMark/paragraph";
import AtxHeading from "@muya/block/commonMark/atxHeading";
import SetextHeading from "@muya/block/commonMark/setextHeading";
import ThematicBreak from "@muya/block/commonMark/thematicBreak";
import CodeBlock from "@muya/block/commonMark/codeBlock";
import Code from "@muya/block/commonMark/codeBlock/code";
import Table from "@muya/block/gfm/table";
import TableInner from "@muya/block/gfm/table/table";
import TableRow from "@muya/block/gfm/table/row";
import Cell from "@muya/block/gfm/table/cell";
import HTMLBlock from "@muya/block/commonMark/html";
import HTMLContainer from "@muya/block/commonMark/html/htmlContainer";
import MathBlock from "@muya/block/extra/math";
import MathContainer from "@muya/block/extra/math/mathContainer";
import Frontmatter from "@muya/block//extra/frontmatter";
import DiagramBlock from "@muya/block/extra/diagram";
import DiagramContainer from "@muya/block/extra/diagram/diagramContainer";
// container block
import BlockQuote from "@muya/block/commonMark/blockQuote";
import OrderList from "@muya/block/commonMark/orderList";
import ListItem from "@muya/block/commonMark/listItem";
import BulletList from "@muya/block/commonMark/bulletList";
import TaskList from "@muya/block/gfm/taskList";
import TaskListItem from "@muya/block/gfm/taskListItem";
// content
import ParagraphContent from "@muya/block/content/paragraphContent";
import AtxHeadingContent from "@muya/block/content/atxHeadingContent";
import SetextHeadingContent from "@muya/block/content/setextHeadingContent";
import ThematicBreakContent from "@muya/block/content/thematicBreakContent";
import LangInputContent from "@muya/block/content/langInputContent";
import CodeBlockContent from "@muya/block/content/codeBlockContent";
import TableCellContent from "@muya/block/content/tableCell";
// Attachment Block
import TaskListCheckbox from "@muya/block/gfm/taskListCheckbox";
import HTMLPreview from "@muya/block/commonMark/html/htmlPreview";
import MathPreview from "@muya/block/extra/math/mathPreview";
import DiagramPreview from "@muya/block/extra/diagram/diagramPreview";

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

export default ScrollPage;
