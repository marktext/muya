import Selection from '@/selection'

export default {
  backspaceHandler (event) {
    const { start, end } = Selection.getCursorOffsets(this.domNode)
    // Let input handler to handle this case.
    if (start.offset !== end.offset) {
      return
    }
    // TODO: images, inline math, ruby etc...
    console.log('backspace')
  }
}
