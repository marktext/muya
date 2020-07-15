import * as json1 from 'ot-json1'
import logger from '@/utils/logger'
import StateToMarkdown from './stateToMarkdown'
import MarkdownToState from './markdownToState'

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
    const {
      footnote,
      isGitlabCompatibilityEnabled,
      superSubScript,
      trimUnnecessaryCodeBlockEmptyLines
    } = this.muya.options

    this.state = typeof state === 'object' ? state : new MarkdownToState(state, {
      footnote,
      isGitlabCompatibilityEnabled,
      superSubScript,
      trimUnnecessaryCodeBlockEmptyLines
    }).generate()

    this.operationCache = []
    this.isGoing = false
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

  /**
   * This method only used by user source.
   * @param {string} method json1 operation method insertOp, removeOp, replaceOp, editOp
   * @param  {...any} args
   */
  pushOperation (method, ...args) {
    const operation = json1[method](...args)
    this.operationCache.push(operation)

    if (!this.isGoing) {
      this.isGoing = true
      requestAnimationFrame(() => {
        const op = this.operationCache.reduce(json1.type.compose)

        this.apply(op)
        this.muya.eventCenter.emit('json-change', {
          op,
          source: 'user'
        })
        this.operationCache = []
        this.isGoing = false
      })
    }
  }

  dispatch (op, source = 'user'/* user, history, api */) {
    this.apply(op)
    debug.log(op)
    this.muya.eventCenter.emit('json-change', {
      op,
      source
    })
  }

  getMarkdown () {
    const state = this.getState()
    const mdGenerator = new StateToMarkdown(state)

    return mdGenerator.generate()
  }
}

export default JSONState
