import ScrollPage from '@/block'

export default {
  cutHandler (event) {
    const { isSelectionInSameBlock, anchor, anchorBlock, focus, focusBlock } = this.selection
    if (isSelectionInSameBlock) {
      const contentBlock = this.getTargetBlock(event)

      if (!contentBlock) {
        return
      }
  
      const { start, end } = contentBlock.getCursor()
      const { text } = contentBlock
  
      contentBlock.text = text.substring(0, start.offset) + text.substring(end.offset)
      return contentBlock.setCursor(start.offset, start.offset, true)
    }

    const anchorOutMostBlock = anchorBlock.outMostBlock
    const focusOutMostBlock = focusBlock.outMostBlock
    const anchorOutMostBlockOffset = this.scrollPage.offset(anchorOutMostBlock)
    const focusOutMostBlockOffset = this.scrollPage.offset(focusOutMostBlock)
    const isPositiveSequence = anchorOutMostBlockOffset <= focusOutMostBlockOffset
    const startOutBlock = isPositiveSequence ? anchorOutMostBlock : focusOutMostBlock
    const endOutBlock = isPositiveSequence ? focusOutMostBlock : anchorOutMostBlock
    const startBlock = isPositiveSequence ? anchorBlock : focusBlock
    const endBlock =  isPositiveSequence ? focusBlock : anchorBlock
    const startOffset = isPositiveSequence ? anchor.offset : focus.offset
    const endOffset = isPositiveSequence ? focus.offset : anchor.offset
    let cursorBlock
    let cursorOffset

    const removePartial = (position) => {
      const outBlock = position === 'start' ? startOutBlock : endOutBlock
      const block = position === 'start' ? startBlock : endBlock
      // Handle anchor and focus in different blocks
      if (/block-qoute|code-block|html-block|table|math-block|frontmatter|diagram/.test(outBlock.blockName)) {
        outBlock.remove()
      } else if (/bullet-list|order-list|task-list/.test(outBlock.blockName)) {
        const listItemBlockName = outBlock.blockName === 'task-list' ? 'task-list-item' : 'list-item'
        const listItem = block.farthestBlock(listItemBlockName)
        const offset = outBlock.offset(listItem)
        outBlock.forEach((item, index) => {
          if (position === 'start' && index >= offset || position === 'end' && index <= offset) {
            if (item.isOnlyChild()) {
              outBlock.remove()
            } else {
              item.remove()
            }
          }
        })
      } else {
        if (position === 'start' && startOffset < startBlock.text.length) {
          startBlock.text = startBlock.text.substring(0, startOffset)
          cursorBlock = startBlock
          cursorOffset = startOffset
        } else if (position === 'end') {
          if (this.scrollPage.children.contains(startOutBlock)) {
            startBlock.text += endBlock.text.substring(endOffset)
            endOutBlock.remove()
          } else {
            endBlock.text = endBlock.text.substring(endOffset)
            cursorBlock = endBlock
            cursorOffset = 0
          }
        }
      }
    }

    if (anchorOutMostBlock === focusOutMostBlock) {
      // Handle anchor and focus in same list\quote block
      if (anchorOutMostBlock.blockName === 'block-quote') {
        anchorOutMostBlock.remove()
      } else {
        const listItemBlockName = anchorOutMostBlock.blockName === 'task-list' ? 'task-list-item' : 'list-item'
        const anchorFarthestListItem = anchorBlock.farthestBlock(listItemBlockName)
        const focusFarthestListItem = focusBlock.farthestBlock(listItemBlockName)
        const anchorOffset = anchorOutMostBlock.offset(anchorFarthestListItem)
        const focusOffset = anchorOutMostBlock.offset(focusFarthestListItem)
        const minOffset = Math.min(anchorOffset, focusOffset)
        const maxOffset = Math.max(anchorOffset, focusOffset)
        anchorOutMostBlock.forEach((item, index) => {
          if (index >= minOffset && index <= maxOffset) {
            if (item.isOnlyChild()) {
              anchorOutMostBlock.remove()
            } else {
              item.remove()
            }
          }
        })
      }
    } else {
      removePartial('start')
      // Get State between the start outmost block and the end outmost block.
      let node = startOutBlock.next
      while (node && node !== endOutBlock) {
        const temp = node.next
        node.remove()
        node = temp
      }
      removePartial('end')
      if (cursorBlock) {
        cursorBlock.setCursor(cursorOffset, cursorOffset, true)
      }
    }

    console.log(this.scrollPage.length())

    if (this.scrollPage.length() === 0) {
      const state = {
        name: 'paragraph',
        text: ''
      }

      const newParagraphBlock = ScrollPage.loadBlock('paragraph').create(this.muya, state)
      this.scrollPage.append(newParagraphBlock, 'user')
      cursorBlock = newParagraphBlock.firstContentInDescendant()
      cursorBlock.setCursor(0, 0, true)
    }
  }
}
