import ScrollPage from '@/block/scrollPage'
// leaf block
import Paragraph from '@/block/commonMark/paragraph'
import AtxHeading from '@/block/commonMark/atxHeading'
import SetextHeading from '@/block/commonMark/setextHeading'
// container block
import BlockQuote from '@/block/commonMark/blockQuote'
// content
import ParagraphContent from '@/block/content/paragraphContent'
import AtxHeadingContent from '@/block/content/atxHeadingContent'
import SetextHeadingContent from '@/block/content/setextHeadingContent'

// Register itself
ScrollPage.register(ScrollPage)
ScrollPage.register(Paragraph)
ScrollPage.register(ParagraphContent)
ScrollPage.register(AtxHeading)
ScrollPage.register(AtxHeadingContent)
ScrollPage.register(SetextHeading)
ScrollPage.register(SetextHeadingContent)
ScrollPage.register(BlockQuote)

export default ScrollPage
