import marked from '@/utils/marked'
import StateToMarkdown from '../jsonState/stateToMarkdown'

export default {
  getClipboardData (event) {
    const { copyType, copyInfo } = this
    if (copyType === 'copyCodeContent') {
      return {
        html: '',
        text: copyInfo
      }
    }

    let text = ''
    let html = ''

    const { isSelectionInSameBlock, anchor, anchorBlock, focus, focusBlock } = this.selection
    const { frontMatter = true } = this.muya.options
    // Handler copy/cut in one block.
    if (isSelectionInSameBlock) {
      const contentBlock = this.getTargetBlock(event)

      if (!contentBlock) {
        return { html, text }
      }
  
      const { start, end } = contentBlock.getCursor()
      text = contentBlock.text.substring(start.offset, end.offset)
      html = marked(text, { frontMatter })

      return { html, text }
    }
    // Handle select multiple blocks.
    const copyState = []
    const anchorOutMostBlock = anchorBlock.outMostBlock
    const focusOutMostBlock = focusBlock.outMostBlock
    const anchorOutMostBlockOffset = this.scrollPage.offset(anchorOutMostBlock)
    const focusOutMostBlockOffset = this.scrollPage.offset(focusOutMostBlock)
    const startOutBlock = anchorOutMostBlockOffset <= focusOutMostBlockOffset ? anchorOutMostBlock : focusOutMostBlock
    const endOutBlock = anchorOutMostBlockOffset <= focusOutMostBlockOffset ? focusOutMostBlock : anchorOutMostBlock
    const startBlock = anchorOutMostBlockOffset <= focusOutMostBlockOffset ? anchorBlock : focusBlock
    const endBlock =  anchorOutMostBlockOffset <= focusOutMostBlockOffset ? focusBlock : anchorBlock
    const startOffset = anchorOutMostBlockOffset <= focusOutMostBlockOffset ? anchor.offset : focus.offset
    const endOffset = anchorOutMostBlockOffset <= focusOutMostBlockOffset ? focus.offset : anchor.offset

    const getPartialState = (position) => {
      const outBlock = position === 'start' ? startOutBlock : endOutBlock
      const block = position === 'start' ? startBlock : endBlock
      // Handle anchor and focus in different blocks
      if (/block-qoute|code-block|html-block|table|math-block|frontmatter|diagram/.test(outBlock.blockName)) {
        copyState.push(outBlock.getState())
      } else if (/bullet-list|order-list|task-list/.test(outBlock.blockName)) {
        const listItemBlockName = outBlock.blockName === 'task-list' ? 'task-list-item' : 'list-item'
        const listItem = block.farthestBlock(listItemBlockName)
        const offset = outBlock.offset(listItem)
        const { name, meta, children } = outBlock.getState()
        copyState.push(
          {
            name,
            meta,
            children: children.filter((_, index) => position === 'start' ? index >= offset : index <= offset)
          }
        )
      } else {
        if (position === 'start' && startOffset < startBlock.text.length) {
          copyState.push({
            name: 'paragraph',
            text: startBlock.text.substring(startOffset)
          })
        } else if (position === 'end' && endOffset > 0) {
          copyState.push({
            name: 'paragraph',
            text: endBlock.text.substring(0, endOffset)
          })
        }
      }
    }

    if (anchorOutMostBlock === focusOutMostBlock) {
      // Handle anchor and focus in same list\quote block
      if (anchorOutMostBlock.blockName === 'block-quote') {
        copyState.push(anchorOutMostBlock.getState())
      } else {
        const listItemBlockName = anchorOutMostBlock.blockName === 'task-list' ? 'task-list-item' : 'list-item'
        const anchorFarthestListItem = anchorBlock.farthestBlock(listItemBlockName)
        const focusFarthestListItem = focusBlock.farthestBlock(listItemBlockName)
        const anchorOffset = anchorOutMostBlock.offset(anchorFarthestListItem)
        const focusOffset = anchorOutMostBlock.offset(focusFarthestListItem)
        const minOffset = Math.min(anchorOffset, focusOffset)
        const maxOffset = Math.max(anchorOffset, focusOffset)
        const { name, meta, children } = anchorOutMostBlock.getState()
        copyState.push(
          {
            name,
            meta,
            children: children.filter((_, index) => index >= minOffset && index <= maxOffset)
          }
        )
      }
    } else {
      getPartialState('start')
      // Get State between the start outmost block and the end outmost block.
      let node = startOutBlock.next
      while (node && node !== endOutBlock) {
        copyState.push(node.getState())
        node = node.next
      }
      getPartialState('end')
    }

    const mdGenerator = new StateToMarkdown()

    text = mdGenerator.generate(copyState)
    html = marked(text, { frontMatter })

    return { html, text }
  },

  copyHandler (event) {
    const { html, text } = this.getClipboardData(event)

    const { copyType } = this

    switch (copyType) {
      case 'normal': {
        event.clipboardData.setData('text/html', html)
        event.clipboardData.setData('text/plain', text)
        break
      }

      case 'copyAsHtml': {
        event.clipboardData.setData('text/html', '')
        event.clipboardData.setData('text/plain', html)
        break
      }

      case 'copyAsMarkdown': {
        event.clipboardData.setData('text/html', '')
        event.clipboardData.setData('text/plain', text)
        break
      }

      case 'copyCodeContent': {
        event.clipboardData.setData('text/html', '')
        event.clipboardData.setData('text/plain', text)
        break
      }
    }
  }
}