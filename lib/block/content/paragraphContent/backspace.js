import logger from '@/utils/logger'

const debug = logger('paragraph:content')

export default {
  paragraphParentType () {
    if (this.static.blockName !== 'paragraph.content') {
      debug.warn('Only paragraph content can call paragraphParentType')

      return
    }

    let { parent } = this
    let type = 'paragraph'

    while (parent && !parent.isScrollPage) {
      if (parent.static.blockName === 'block-quote') {
        type = 'block-quote'
        break
      }
      parent = parent.parent
    }

    return type
  },

  handleBackspaceInParagraph () {
    const previousContentBlock = this.previousContentInContext()
    // Handle no previous content block, the first paragraph in document.
    if (!previousContentBlock) {
      return
    }
    const { text: oldText, path } = previousContentBlock
    const offset = oldText.length
    previousContentBlock.text += this.text
    const cursor = {
      block: previousContentBlock,
      path,
      start: { offset },
      end: { offset }
    }
    previousContentBlock.update(cursor)
    this.parent.remove()
    this.selection.setSelection(cursor)
  },

  handleBackspaceInBlockQuote () {
    const { parent } = this
    const blockQuote = parent.parent
    let cursorBlock

    if (!parent.isOnlyChild() && !parent.isFirstChild()) {
      return this.handleBackspaceInParagraph()
    }

    if (parent.isOnlyChild()) {
      blockQuote.replaceWith(parent)
      cursorBlock = parent.children.head
    } else if (parent.isFirstChild()) {
      const cloneParagraph = parent.clone()
      blockQuote.parent.insertBefore(cloneParagraph, blockQuote)
      parent.remove()
      cursorBlock = cloneParagraph.children.head
    }

    cursorBlock.setCursor(0, 0, true)
  }
}
