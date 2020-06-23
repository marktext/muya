import Selection from '@/selection'
import ScrollPage from '@/block'
import { PARAGRAPH_STATE } from '@/config'
import { deepCopy } from '@/utils'

export default {
  shiftEnterHandler () {
    const { text: oldText } = this
    const { start, end } = Selection.getCursorOffsets(this.domNode)
    this.text = oldText.substring(0, start.offset) + '\n' + oldText.substring(end.offset)
    this.setCursor(start.offset + 1, end.offset + 1, true)
  },

  enterHandler (event) {
    event.preventDefault()
    const { text: oldText, muya, parent, selection } = this
    const { start, end } = Selection.getCursorOffsets(this.domNode)
    this.text = oldText.substring(0, start.offset)
    const textOfNewNode = oldText.substring(end.offset)
    const newNodeState = deepCopy(PARAGRAPH_STATE)
    newNodeState.text = textOfNewNode

    const newNode = ScrollPage.loadBlock(newNodeState.name).create(muya, newNodeState)

    parent.parent.insertAfter(newNode, parent)

    const newContentNode = newNode.children.head
    const cursor = {
      path: newContentNode.path,
      block: newContentNode,
      anchor: {
        offset: 0
      },
      focus: {
        offset: 0
      }
    }

    this.update(cursor)

    if (newContentNode.checkNeedRender(cursor)) {
      newContentNode.update(cursor)
    }

    selection.setSelection(cursor)
  }
}
