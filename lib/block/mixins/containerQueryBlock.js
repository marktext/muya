export default {
  queryBlock (path) {
    if (path[0] === 'children') {
      path.shift()
    }

    if (path.length === 0) {
      return this
    }

    const p = path.shift()
    const block = this.find(p)

    return block && path.length ? block.queryBlock(path) : block
  }
}
