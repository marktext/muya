export default {
  deleteHandler (event) {
    const { start, end } = this.getCursor()
    const { text } = this
    // Let input handler to handle this case.
    if (start.offset !== end.offset || start.offset !== text.length) {
      return
    }
    const nextBlock = this.nextContentInContext()
    if (!nextBlock || nextBlock.blockName !== 'paragraph.content') {
      // If the next block is code conent or table cell, nothing need to do.
      return
    }

    const paragraphBlock = nextBlock.parent
    let needRemovedBlock = paragraphBlock

    while (
      needRemovedBlock &&
      needRemovedBlock.isOnlyChild() &&
      !needRemovedBlock.isScrollPage
    ) {
      needRemovedBlock = needRemovedBlock.parent
    }

    this.text = text + nextBlock.text
    this.setCursor(start.offset, end.offset, true)
    needRemovedBlock.remove()
  }
}
