import diff from 'fast-diff'
import json1 from 'ot-json1'
import Selection from '@/selection'
import ScrollPage from '@/block'
import { PARAGRAPH_STATE } from '@/config'
import { diffToTextOp, deepCopy } from '@/utils'

export default {
  shiftEnterHandler () {
    const { text: oldText, selection, path, jsonState } = this
    const { start, end } = Selection.getCursorOffsets(this.domNode)
    this.text = oldText.substring(0, start.offset) + '\n' + oldText.substring(end.offset)
    const cursor = {
      block: this,
      path,
      start: {
        offset: start.offset + 1
      },
      end: {
        offset: start.offset + 1
      }
    }
    this.update(cursor)
    selection.setSelection(cursor)
    // dispatch operation
    const diffs = diff(oldText, this.text)
    const op = json1.editOp(path, 'text-unicode', diffToTextOp(diffs))

    jsonState.dispatch(op, 'user')
  },

  enterHandler (event) {
    event.preventDefault()
    const { text: oldText, muya, parent, selection, path, jsonState } = this
    const { start, end } = Selection.getCursorOffsets(this.domNode)
    const newText = this.text = oldText.substring(0, start.offset)
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

    // dispatch change to modify json state
    const diffs = diff(oldText, newText)
    const op1 = json1.editOp(path, 'text-unicode', diffToTextOp(diffs))

    const op2 = json1.insertOp(
      newNode.path,
      newNodeState
    )
    const op = json1.type.compose(op1, op2)
    jsonState.dispatch(op, 'user')
  }
}
