import diff from 'fast-diff'
import json1 from 'ot-json1'
import Content from '@/block/base/content'
import Selection from '@/selection'
import { getTextContent } from '@/selection/dom'
import ScrollPage from '@/block'
import { EVENT_KEYS, PARAGRAPH_STATE, BRACKET_HASH, BACK_HASH, CLASS_NAMES } from '@/config'
import { diffToTextOp, deepCopy } from '@/utils'

import './index.css'

class ParagraphContent extends Content {
  static blockName = 'paragraph.content'

  static create (muya, parent, text) {
    const content = new ParagraphContent(muya, parent, text)

    return content
  }

  get path () {
    const { path: pPath } = this.parent

    return [...pPath, 'text']
  }

  get selection () {
    return this.muya.editor.selection
  }

  constructor (muya, parent, text) {
    super(muya, parent, text)
    this.classList = [...this.classList, 'mu-paragraph-content']
    this.createDomNode()
  }

  update (cursor) {
    return this.inlineRenderer.patch(this, cursor)
  }

  inputHandler = (event) => {
    if (this.isComposed) {
      return
    }

    const { domNode, text: oldText } = this
    const { start, end } = Selection.getCursorOffsets(domNode)
    const { start: oldStart } = this.selection
    let text = getTextContent(domNode, [CLASS_NAMES.MU_MATH_RENDER, CLASS_NAMES.MU_RUBY_RENDER])
    let needRender = false

    if (this.text !== text) {
      if (
        start.offset === end.offset &&
        event.type === 'input'
      ) {
        const { offset } = start
        const { autoPairBracket, autoPairMarkdownSyntax, autoPairQuote } = this.muya.options
        const inputChar = text.charAt(+offset - 1)
        const preInputChar = text.charAt(+offset - 2)
        const prePreInputChar = text.charAt(+offset - 3)
        const postInputChar = text.charAt(+offset)

        if (/^delete/.test(event.inputType)) {
          // handle `deleteContentBackward` or `deleteContentForward`
          const deletedChar = this.text[offset]
          if (event.inputType === 'deleteContentBackward' && postInputChar === BRACKET_HASH[deletedChar]) {
            needRender = true
            text = text.substring(0, offset) + text.substring(offset + 1)
          }

          if (event.inputType === 'deleteContentForward' && inputChar === BACK_HASH[deletedChar]) {
            needRender = true
            start.offset -= 1
            end.offset -= 1
            text = text.substring(0, offset - 1) + text.substring(offset)
          }
          /* eslint-disable no-useless-escape */
        } else if (
          (event.inputType.indexOf('delete') === -1) &&
          (inputChar === postInputChar) &&
          (
            (autoPairQuote && /[']{1}/.test(inputChar)) ||
            (autoPairQuote && /["]{1}/.test(inputChar)) ||
            (autoPairBracket && /[\}\]\)]{1}/.test(inputChar)) ||
            (autoPairMarkdownSyntax && /[$]{1}/.test(inputChar)) ||
            (autoPairMarkdownSyntax && /[*$`~_]{1}/.test(inputChar)) && /[_*~]{1}/.test(prePreInputChar)
          )
        ) {
          needRender = true
          text = text.substring(0, offset) + text.substring(offset + 1)
        } else {
          /* eslint-disable no-useless-escape */
          // Not Unicode aware, since things like \p{Alphabetic} or \p{L} are not supported yet
          const isInInlineMath = this.checkCursorInTokenType(text, offset, 'inline_math')
          const isInInlineCode = this.checkCursorInTokenType(text, offset, 'inline_code')

          if (
            !/\\/.test(preInputChar) &&
            ((autoPairQuote && /[']{1}/.test(inputChar) && !(/[a-zA-Z\d]{1}/.test(preInputChar))) ||
            (autoPairQuote && /["]{1}/.test(inputChar)) ||
            (autoPairBracket && /[\{\[\(]{1}/.test(inputChar)) ||
            (!isInInlineMath && !isInInlineCode && autoPairMarkdownSyntax && /[*$`~_]{1}/.test(inputChar)))
          ) {
            needRender = true
            text = BRACKET_HASH[event.data]
              ? text.substring(0, offset) + BRACKET_HASH[inputChar] + text.substring(offset)
              : text
          }

          /* eslint-enable no-useless-escape */
          // Delete the last `*` of `**` when you insert one space between `**` to create a bullet list.
          if (
            /\s/.test(event.data) &&
            /^\* /.test(text) &&
            preInputChar === '*' &&
            postInputChar === '*'
          ) {
            text = text.substring(0, offset) + text.substring(offset + 1)
            needRender = true
          }
        }
      }

      if (this.checkNotSameToken(this.text, text)) {
        needRender = true
      }

      // Just work for `Shift + Enter` to create a soft and hard line break.
      if (
        this.text.endsWith('\n') &&
        start.offset === text.length &&
        (event.inputType === 'insertText' || event.type === 'compositionend')
      ) {
        this.text += event.data
        start.offset++
        end.offset++
      } else if (
        this.text.length === oldStart.offset &&
        this.text[oldStart.offset - 2] === '\n' &&
        event.inputType === 'deleteContentBackward'
      ) {
        this.text = this.text.substring(0, oldStart.offset - 1)
        start.offset = this.text.length
        end.offset = this.text.length
      } else {
        this.text = text
      }
    }

    const cursor = {
      path: this.path,
      block: this,
      anchor: {
        offset: start.offset
      },
      focus: {
        offset: end.offset
      }
    }

    const checkMarkedUpdate = this.checkNeedRender()

    if (checkMarkedUpdate || needRender) {
      this.update(cursor)
    }

    this.selection.setSelection(cursor)
    // dispatch change to modify json state
    const diffs = diff(oldText, this.text)
    const op = json1.editOp(this.path, 'text-unicode', diffToTextOp(diffs))
    console.log(op)
    this.jsonState.dispatch(op, 'user')
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

  keyupHandler = (event) => {
    if (this.isComposed) {
      return
    }

    const { anchor, focus } = Selection.getCursorOffsets(this.domNode)
    const { anchor: oldAnchor, focus: oldFocus } = this.selection
    console.log(anchor.offset, oldAnchor.offset)
    if (anchor.offset !== oldAnchor.offset || focus.offset !== oldFocus.offset) {
      const needUpdate = this.checkNeedRender({ anchor, focus }) || this.checkNeedRender()
      const cursor = { anchor, focus, block: this, path: this.path }

      if (needUpdate) {
        this.update(cursor)
      }

      this.selection.setSelection(cursor)
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
    const newText = this.text = oldText.substring(0, start.offset)
    const textOfNewNode = oldText.substring(end.offset)
    const newNodeState = deepCopy(PARAGRAPH_STATE)
    newNodeState.text = textOfNewNode

    const newNode = ScrollPage.loadBlock(newNodeState.name).create(muya, parent.parent, newNodeState)
    parent.parent.insertAfter(newNode, parent)

    const cursor = {
      path: newNode.children.head.path,
      block: newNode.children.head,
      anchor: {
        offset: 0
      },
      focus: {
        offset: 0
      }
    }

    this.update(cursor)

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

  arrowHandler (event) {
    console.log('arrow')
  }

  tabHandler (event) {
    console.log('tab')
  }
}

export default ParagraphContent
