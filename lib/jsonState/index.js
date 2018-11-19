import otJSON0 from 'ot-json0'

class JSONState {
  static invertComponent (c) {
    return otJSON0.invertComponent(c)
  }

  static invert (op) {
    return otJSON0.invert(op)
  }

  static compose (op1, op2) {
    return otJSON0.compose(op1, op2)
  }

  static transform (op, otherOp, type) {
    return otJSON0.transform(op, otherOp, type)
  }

  // use this to access static methods
  get statics() {
    return this.constructor
  }

  constructor (state) {
    this.state = state
  }
  // TODO@jocs convert jsonState to markdown
  toMarkdown () {}
  // TODO@jocs convert jsonState to block
  toBlock () {}

  apply (op) {
    return otJSON0.apply(this.state, op)
  }
}

export default JSONState
