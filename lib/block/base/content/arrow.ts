import Selection from '@muya/selection'
import ScrollPage from '@muya/block'
import { EVENT_KEYS } from '@muya/config'
import { adjustOffset } from '@muya/utils'

export default {
  arrowHandler (event) {
    const previousContentBlock = this.previousContentInContext()
    const nextContentBlock = this.nextContentInContext()
    const { start, end } = this.getCursor()
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
        this.scrollPage.append(newNode, 'user')
        cursorBlock = newNode.children.head
      }
      offset = adjustOffset(0, cursorBlock, event)
    }

    if (cursorBlock) {
      this.update()
      cursorBlock.setCursor(offset, offset, true)
    }
  }
}
