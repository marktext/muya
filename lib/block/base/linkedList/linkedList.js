class LinkedList {
  constructor () {
    this.head = this.tail = null
    this.length = 0
  }

  *iterator (curNode = this.head, length = this.length) {
    let count = 0

    while (count < length && curNode) {
      yield curNode
      count++
      curNode = curNode.next
    }
  }

  append (...nodes) {
    for (const node of nodes) {
      this.insertBefore(node)
    }
  }

  contains (node) {
    const it = this.iterator()
    let data = null

    while ((data = it.next()).done !== true) {
      const { value } = data
      if (value === node) {
        return true
      }
    }

    return false
  }

  insertBefore (node, refNode = null) {
    if (!node) return
    node.next = refNode
    if (refNode !== null) {
      node.prev = refNode.prev
      if (refNode.prev !== null) {
        refNode.prev.next = node
      }
      refNode.prev = node
      if (this.head === refNode) {
        this.head = node
      }
    } else if (this.tail !== null) {
      this.tail.next = node
      node.prev = this.tail
      this.tail = node
    } else {
      node.prev = null
      this.head = this.tail = node
    }
    this.length += 1
  }

  offset (node) {
    return [...this.iterator()].indexOf(node)
  }

  remove (node) {
    // If linkedList does not contain this node, just return
    if (!this.contains(node)) return
    if (node.prev) {
      node.prev.next = node.next
    }

    if (node.next) {
      node.next.prev = node.prev
    }

    if (this.head === node) {
      this.head = node.next
    }

    if (this.tail === node) {
      this.tail = node.prev
    }
    this.length -= 1
  }

  find (index) {
    if (index < 0 || index >= this.length) {
      return null
    }

    return [...this.iterator()][index]
  }

  forEach (callback) {
    return [...this.iterator()].forEach(callback)
  }

  forEachAt (index, length, callback) {
    const curNode = this.find(index)

    return [...this.iterator(curNode, length)].forEach((node, i) => {
      callback(node, i + index)
    })
  }

  map (callback) {
    return this.reduce((acc, node, i) => {
      return [...acc, callback(node, i)]
    }, [])
  }

  reduce (callback, initialValue = this.head) {
    return [...this.iterator()].reduce(callback, initialValue)
  }
}

export default LinkedList
