import ScrollPage from '@/block/scrollPage'
// leaf block
import Paragraph from '@/block/commonMark/paragraph'
import AtxHeading from '@/block/commonMark/atxHeading'
import SetextHeading from '@/block/commonMark/setextHeading'
import ThematicBreak from '@/block/commonMark/thematicBreak'
import CodeBlock from '@/block/commonMark/codeBlock'
import Code from '@/block/commonMark/codeBlock/code'
import Table from '@/block/gfm/table'
import TableInner from '@/block/gfm/table/table'
import TableRow from '@/block/gfm/table/row'
import Cell from '@/block/gfm/table/cell'
import HTMLBlock from '@/block/commonMark/html'
import HTMLContainer from '@/block/commonMark/html/htmlContainer'
// container block
import BlockQuote from '@/block/commonMark/blockQuote'
import OrderList from '@/block/commonMark/orderList'
import ListItem from '@/block/commonMark/listItem'
import BulletList from '@/block/commonMark/bulletList'
import TaskList from '@/block/gfm/taskList'
import TaskListItem from '@/block/gfm/taskListItem'
// content
import ParagraphContent from '@/block/content/paragraphContent'
import AtxHeadingContent from '@/block/content/atxHeadingContent'
import SetextHeadingContent from '@/block/content/setextHeadingContent'
import ThematicBreakContent from '@/block/content/thematicBreakContent'
import LangInputContent from '@/block/content/langInputContent'
import CodeBlockContent from '@/block/content/codeBlockContent'
import TableCellContent from '@/block/content/tableCell'
// Attachment Block
import TaskListCheckbox from '@/block/gfm/taskListCheckbox'
import HTMLPreview from '@/block/commonMark/html/htmlPreview'

// Register itself
ScrollPage.register(ScrollPage)
ScrollPage.register(Paragraph)
ScrollPage.register(ParagraphContent)
ScrollPage.register(AtxHeading)
ScrollPage.register(AtxHeadingContent)
ScrollPage.register(SetextHeading)
ScrollPage.register(SetextHeadingContent)
ScrollPage.register(BlockQuote)
ScrollPage.register(ThematicBreak)
ScrollPage.register(ThematicBreakContent)
ScrollPage.register(CodeBlock)
ScrollPage.register(Code)
ScrollPage.register(LangInputContent)
ScrollPage.register(CodeBlockContent)
ScrollPage.register(OrderList)
ScrollPage.register(ListItem)
ScrollPage.register(BulletList)
ScrollPage.register(TaskList)
ScrollPage.register(TaskListItem)
ScrollPage.register(TaskListCheckbox)
// Table
ScrollPage.register(Table)
ScrollPage.register(TableInner)
ScrollPage.register(TableRow)
ScrollPage.register(Cell)
ScrollPage.register(TableCellContent)
// HTML
ScrollPage.register(HTMLBlock)
ScrollPage.register(HTMLPreview)
ScrollPage.register(HTMLContainer)

export default ScrollPage
