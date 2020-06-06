class Selection {
  constructor (muya) {
    this.muya = muya
    this.doc = document
    this.cursor = {
      anchor: { path: [], offset: 0 },
      focus: { path: [], offset: 0 }
    }
  }

  select (startNode, startOffset, endNode, endOffset) {
    const range = this.doc.createRange()
    range.setStart(startNode, startOffset)
    if (endNode) {
      range.setEnd(endNode, endOffset)
    } else {
      range.collapse(true)
    }
    this.selectRange(range)

    return range
  }

  setFocus (focusNode, focusOffset) {
    const selection = this.doc.getSelection()
    selection.extend(focusNode, focusOffset)
  }
}

export default Selection
