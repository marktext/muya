import * as json1 from 'ot-json1'

const DEFAULT_OPTIONS = {
  delay: 1000,
  maxStack: 100,
  userOnly: false
}

class History {
  get jsonState () {
    return this.muya.editor.jsonState
  }

  constructor (muya, options = {}) {
    this.muya = muya
    this.options = Object.assign({}, DEFAULT_OPTIONS, options)
    this.lastRecorded = 0
    this.ignoreChange = false
    this.clear()
    this.muya.eventCenter.on(
      'json-change',
      ({ op, source }) => {
        if (this.ignoreChange) {
          return
        }

        if (!this.options.userOnly || source === 'user') {
          this.record(op)
        } else {
          this.transform(op)
        }
      }
    )
  }

  change (source, dest) {
    if (this.stack[source].length === 0) {
      return
    }
    const operation = this.stack[source].pop()
    const inverseOperation = json1.type.invert(operation)
    this.stack[dest].push(inverseOperation)
    this.lastRecorded = 0
    this.ignoreChange = true
    this.muya.editor.updateContents(operation, 'user')
    this.ignoreChange = false
  }

  clear () {
    this.stack = { undo: [], redo: [] }
  }

  cutoff () {
    this.lastRecorded = 0
  }

  record (op) {
    if (op.length === 0) {
      return
    }
    this.stack.redo = []
    let undoOperation = json1.type.invert(op)
    const timestamp = Date.now()
    if (
      this.lastRecorded + this.options.delay > timestamp &&
      this.stack.undo.length > 0
    ) {
      const lastOperation = this.stack.undo.pop()
      undoOperation = json1.type.compose(undoOperation, lastOperation)
    } else {
      this.lastRecorded = timestamp
    }

    if (!undoOperation || undoOperation.length === 0) {
      return
    }

    this.stack.undo.push(undoOperation)
    if (this.stack.undo.length > this.options.maxStack) {
      this.stack.undo.shift()
    }
  }

  redo () {
    this.change('redo', 'undo')
  }

  transform (operation) {
    transformStack(this.stack.undo, operation)
    transformStack(this.stack.redo, operation)
  }

  undo () {
    this.change('undo', 'redo')
  }
}

function transformStack (stack, operation) {
  let remoteOperation = operation

  for (let i = stack.length - 1; i >= 0; i -= 1) {
    const oldOperation = stack[i]
    // TODO: need test.
    stack[i] = json1.type.transform(oldOperation, remoteOperation, 'left')
    remoteOperation = json1.type.transform(remoteOperation, oldOperation, 'right')
    if (stack[i].length() === 0) {
      stack.splice(i, 1)
    }
  }
}

export default History
