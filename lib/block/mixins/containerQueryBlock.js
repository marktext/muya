export default {
  queryBlock (path) {
    if (/children|meta|align|type|lang/.test(path[0])) {
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
