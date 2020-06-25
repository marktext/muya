import ScrollPage from '@/block/scrollPage'
// leaf block
import Paragraph from '@/block/commonMark/paragraph'
import AtxHeading from '@/block/commonMark/atxHeading'
import SetextHeading from '@/block/commonMark/setextHeading'
import ThematicBreak from '@/block/commonMark/thematicBreak'
import CodeBlock from '@/block/commonMark/codeBlock'
import Code from '@/block/commonMark/codeBlock/code'
// container block
import BlockQuote from '@/block/commonMark/blockQuote'

// content
import ParagraphContent from '@/block/content/paragraphContent'
import AtxHeadingContent from '@/block/content/atxHeadingContent'
import SetextHeadingContent from '@/block/content/setextHeadingContent'
import ThematicBreakContent from '@/block/content/thematicBreakContent'
import LangInputContent from '@/block/content/langInputContent'
import CodeBlockContent from '@/block/content/codeBlockContent'

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

export default ScrollPage
