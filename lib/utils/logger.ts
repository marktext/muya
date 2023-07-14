const levels = ['error', 'warn', 'log', 'info']
let level = 'log'

function debug (method, ...args) {
  if (levels.indexOf(method) <= levels.indexOf(level) && process.env.NODE_ENV !== 'production') {
    console[method](...args) // eslint-disable-line no-console
  }
}

function namespace (ns) {
  return levels.reduce((logger, method) => {
    logger[method] = debug.bind(console, method, ns)

    return logger
  }, {})
}

namespace.level = newLevel => {
  level = newLevel
}
debug.level = namespace.level

export default namespace
