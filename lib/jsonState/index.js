import otJSON1 from 'ot-json1'
import logger from '@/utils/logger'

const debug = logger('jsonstate:')

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

  constructor (muya, state) {
    this.muya = muya
    this.state = state
    debug.log(this)
  }

  apply (op) {
    this.state = otJSON1.type.apply(this.state, op)
  }

  getState () {
    return this.state
  }

  setState (state) {
    this.state = state
  }

  dispatch (action, payload, source = 'user'/* user, history, api */) {
    switch (action) {
      case 'removeOp':

      case 'insertOp': {
        const { path, value } = payload
        const op = otJSON1[action](path, value)
        this.apply(op)
        break
      }

      case 'moveOp': {
        const { fromPath, toPath } = payload
        const op = otJSON1.moveOp(fromPath, toPath)
        this.apply(op)
        break
      }

      case 'replaceOp': {
        const { path, oldVal, newVal } = payload
        const op = otJSON1.moveOp(path, oldVal, newVal)
        this.apply(op)
        break
      }

      case 'editOp': {
        const { path, op } = payload
        const subtype = 'text-unicode'
        const jsonOp = otJSON1.editOp(path, subtype, op)

        this.apply(jsonOp)
        break
      }

      default:
        debug.error(`Unknown action ${action}`)
        break
    }

    this.muya.event.emit('json-change', {
      action,
      payload,
      source
    })
  }
}

export default JSONState
