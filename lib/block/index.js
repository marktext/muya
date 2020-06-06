import ScrollPage from '@/block/scrollPage'
import Paragraph from '@/block/paragraph'
import Content from '@/block/content'
import ParagraphContent from '@/block/paragraphContent'

// Register itself
ScrollPage.register(ScrollPage)
ScrollPage.register(Paragraph)
ScrollPage.register(Content) // maybe no need to register, because it will never be used directlly.
ScrollPage.register(ParagraphContent)

export default ScrollPage
