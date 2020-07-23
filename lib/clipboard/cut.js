export default {
  cutHandler (event) {
    const contentBlock = this.getTargetBlock(event)

    if (!contentBlock) {
      return
    }

    const { start, end } = contentBlock.getCursor()
    const { text } = contentBlock

    contentBlock.text = text.substring(0, start.offset) + text.substring(end.offset)
    contentBlock.setCursor(start.offset, start.offset, true)
  }
}
