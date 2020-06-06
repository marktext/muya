import otJSON1 from 'ot-json1'

class JSONState {
  static invert (op) {
    // TODO
  }

  static compose (op1, op2) {
    return otJSON1.type.compose(op1, op2)
  }

  static transform (op, otherOp, type) {
    return otJSON1.type.transform(op, otherOp, type)
  }

  // use this to access static methods
  get statics () {
    return this.constructor
  }

  constructor (state) {
    this.state = state
  }

  apply (op) {
    return otJSON1.type.apply(this.state, op)
  }
}

export default JSONState
