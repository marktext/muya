import json1 from 'ot-json1'
import logger from '@/utils/logger'

const debug = logger('jsonstate:')

class JSONState {
  static invert (op) {
    // TODO
  }

  static compose (op1, op2) {
    return json1.type.compose(op1, op2)
  }

  static transform (op, otherOp, type) {
    return json1.type.transform(op, otherOp, type)
  }

  constructor (muya, state) {
    this.muya = muya
    this.state = state
    debug.log(this)
  }

  apply (op) {
    this.state = json1.type.apply(this.state, op)
  }

  getState () {
    return this.state
  }

  setState (state) {
    this.state = state
  }

  dispatch (op, source = 'user'/* user, history, api */) {
    this.apply(op)

    this.muya.eventCenter.emit('json-change', {
      op,
      source
    })
  }
}

export default JSONState
