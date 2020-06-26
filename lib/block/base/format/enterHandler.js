import ScrollPage from '@/block'

export default {
  shiftEnterHandler (event) {
    event.preventDefault()
    event.stopPropagation()

    const { text: oldText } = this
    const { start, end } = this.getCursor()
    this.text = oldText.substring(0, start.offset) + '\n' + oldText.substring(end.offset)
    this.setCursor(start.offset + 1, end.offset + 1, true)
  },

  enterHandler (event) {
    event.preventDefault()
    const { text: oldText, muya, parent } = this
    const { start, end } = this.getCursor()
    this.text = oldText.substring(0, start.offset)
    const textOfNewNode = oldText.substring(end.offset)
    const newNodeState = {
      name: 'paragraph',
      text: textOfNewNode
    }

    const newNode = ScrollPage.loadBlock(newNodeState.name).create(muya, newNodeState)

    parent.parent.insertAfter(newNode, parent)

    this.update()
    newNode.firstContentInDescendant().setCursor(0, 0, true)
  }
}
