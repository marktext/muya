import ScrollPage from '@/block/scrollPage'
import Paragraph from '@/block/commonMark/paragraph'
import AtxHeading from '@/block/commonMark/atxHeading'
import ParagraphContent from '@/block/content/paragraphContent'
import AtxHeadingContent from '@/block/content/atxHeadingContent'

// Register itself
ScrollPage.register(ScrollPage)
ScrollPage.register(Paragraph)
ScrollPage.register(ParagraphContent)
ScrollPage.register(AtxHeading)
ScrollPage.register(AtxHeadingContent)

export default ScrollPage
