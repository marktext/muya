import Selection from '@/selection'
import ScrollPage from '@/block'
import { EVENT_KEYS } from '@/config'

// If the next block is header, put cursor after the `#{1,6} *`
const adjustOffset = (offset, block, event) => {
  if (block.parent.static.blockName === 'atx-heading' && event.key === EVENT_KEYS.ArrowDown) {
    const match = /^\s{0,3}(?:#{1,6})(?:\s{1,}|$)/.exec(block.text)
    if (match) {
      return match[0].length
    }
  }

  return offset
}

export default {
  arrowHandler (event) {
    const previousContentBlock = this.previousContentInContext()
    const nextContentBlock = this.nextContentInContext()
    const { start, end } = Selection.getCursorOffsets(this.domNode)
    const { topOffset, bottomOffset } = Selection.getCursorYOffset(this.domNode)

    // Just do nothing if the cursor is not collapsed or `shiftKey` pressed
    if (
      start.offset !== end.offset ||
      event.shiftKey
    ) {
      return
    }

    if (
      (event.key === EVENT_KEYS.ArrowUp && topOffset > 0) ||
      (event.key === EVENT_KEYS.ArrowDown && bottomOffset > 0)
    ) {
      return
    }

    const { muya } = this
    let cursorBlock = null
    let offset = 0

    if (
      (event.key === EVENT_KEYS.ArrowUp) ||
      (event.key === EVENT_KEYS.ArrowLeft && start.offset === 0)
    ) {
      event.preventDefault()
      event.stopPropagation()

      if (!previousContentBlock) {
        return
      }
      cursorBlock = previousContentBlock
      offset = previousContentBlock.text.length
    } else if (
      (event.key === EVENT_KEYS.ArrowDown) ||
      (event.key === EVENT_KEYS.ArrowRight && start.offset === this.text.length)
    ) {
      event.preventDefault()
      event.stopPropagation()
      if (nextContentBlock) {
        cursorBlock = nextContentBlock
      } else {
        const newNodeState = {
          name: 'paragraph',
          text: ''
        }
        const newNode = ScrollPage.loadBlock(newNodeState.name).create(muya, newNodeState)
        this.scrollPage.append(newNode)
        cursorBlock = newNode.children.head
      }
      offset = adjustOffset(0, cursorBlock, event)
    }

    if (cursorBlock) {
      cursorBlock.setCursor(offset, offset, true)
    }
  }
}
