import diff from 'fast-diff'
import json1 from 'ot-json1'
import Content from '@/block/base/content'
import Selection from '@/selection'
import ScrollPage from '@/block'
import { EVENT_KEYS, PARAGRAPH_STATE } from '@/config'
import { diffToTextOp, deepCopy } from '@/utils'

import './index.css'

class ParagraphContent extends Content {
  static blockName = 'paragraph.content'

  static create (muya, parent, state) {
    const content = new ParagraphContent(muya, parent, state)

    return content
  }

  get path () {
    const { path: pPath } = this.parent
    const offset = this.parent.offset(this)

    return [...pPath, offset, 'text']
  }

  get selection () {
    return this.muya.editor.selection
  }

  constructor (muya, parent, state) {
    super(muya, parent, state)
    this.classList = [...this.classList, 'mu-paragraph-content']
    this.createDomNode()
  }

  inputHandler (event) {
    console.log(event)
  }

  keydownHandler = (event) => {
    switch (event.key) {
      case EVENT_KEYS.Backspace:
        this.backspaceHandler(event)
        break

      case EVENT_KEYS.Delete:
        this.deleteHandler(event)
        break

      case EVENT_KEYS.Enter:
        if (!this.isComposed) {
          this.enterHandler(event)
        }
        break

      case EVENT_KEYS.ArrowUp: // fallthrough

      case EVENT_KEYS.ArrowDown: // fallthrough

      case EVENT_KEYS.ArrowLeft: // fallthrough

      case EVENT_KEYS.ArrowRight: // fallthrough
        if (!this.isComposed) {
          this.arrowHandler(event)
        }
        break

      case EVENT_KEYS.Tab:
        this.tabHandler(event)
        break
      default:
        break
    }
  }

  backspaceHandler (event) {
    console.log('backspace')
  }

  deleteHandler (event) {
    console.log('delete')
  }

  enterHandler (event) {
    event.preventDefault()
    const { text: oldText, muya, parent, selection, path, jsonState } = this
    const { start, end } = Selection.getCursorOffsets(this.domNode)
    const newText = this.text = oldText.substring(0, start)
    const textOfNewNode = oldText.substring(end)
    const newNodeState = deepCopy(PARAGRAPH_STATE)
    newNodeState.children[0].text = textOfNewNode

    const newNode = ScrollPage.loadBlock(newNodeState.name).create(muya, parent.parent, newNodeState)
    parent.parent.insertAfter(newNode, parent)

    this.update()

    selection.setSelection({
      anchor: {
        path: newNode.children.head.path,
        block: newNode.children.head,
        offset: 0
      },
      focus: {
        path: newNode.children.head.path,
        block: newNode.children.head,
        offset: 0
      }
    })

    // dispatch change to modify json state
    const diffs = diff(oldText, newText)
    const op1 = json1.editOp(path, 'text-unicode', diffToTextOp(diffs))
    const op2 = json1.insertOp(
      newNode.path.slice(0, -1),
      newNodeState
    )
    const op = json1.type.compose(op1, op2)
    jsonState.dispatch(op, 'user')
  }

  arrowHandler (event) {
    console.log('arrow')
  }

  tabHandler (event) {
    console.log('tab')
  }
}

export default ParagraphContent
