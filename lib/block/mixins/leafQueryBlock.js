export default {
  queryBlock (path) {
    return path.length && path[0] === 'text' ? this.firstChild : this
  }
}
