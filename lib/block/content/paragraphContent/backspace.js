import diff from 'fast-diff'
import json1 from 'ot-json1'
import { diffToTextOp } from '@/utils'
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
    const { text: oldText, path } = previousContentBlock
    const offset = oldText.length
    const { path: removedPath } = this.parent
    const removedState = this.parent.getState()
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

    // dispatch change to modify json state
    const diffs = diff(oldText, previousContentBlock.text)
    const op1 = json1.editOp(path, 'text-unicode', diffToTextOp(diffs))

    const op2 = json1.removeOp(
      removedPath,
      removedState
    )

    const op = json1.type.compose(op1, op2)
    this.jsonState.dispatch(op, 'user')
  },

  handleBackspaceInBlockQuote () {
    const { parent } = this
    const blockQuote = parent.parent
    let cursorBlock
    let operations = []

    if (!parent.isOnlyChild() && !parent.isFirstChild()) {
      return this.handleBackspaceInParagraph()
    }

    if (parent.isOnlyChild()) {
      const removedState = blockQuote.getState()
      const insertedState = parent.getState()
      blockQuote.replaceWith(parent)
      cursorBlock = parent.children.head

      const { path } = parent
      operations = [
        json1.removeOp(
          path,
          removedState
        ),
        json1.insertOp(
          path,
          insertedState
        )
      ]
    } else if (parent.isFirstChild()) {
      const removedPath = parent.path
      const removedState = parent.getState()
      const cloneParagraph = parent.clone()
      blockQuote.parent.insertBefore(cloneParagraph, blockQuote)
      const insertedPath = cloneParagraph.path
      const insertedState = cloneParagraph.getState()
      parent.remove()
      cursorBlock = cloneParagraph.children.head
      operations = [
        json1.removeOp(
          removedPath,
          removedState
        ),
        json1.insertOp(
          insertedPath,
          insertedState
        )
      ]
    }

    const cursor = {
      block: cursorBlock,
      path: cursorBlock.path,
      start: { offset: 0 },
      end: { offset: 0 }
    }
    cursorBlock.update(cursor)
    this.selection.setSelection(cursor)

    // dispatch json-change event
    const op = operations.reduce(json1.type.compose)
    this.jsonState.dispatch(op, 'user')
  }
}
