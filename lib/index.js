import EventCenter from './eventHandler/eventCenter'

class Muya extends EventCenter {
  static version = typeof MUYA_VERSION === 'undefined' ? 'dev' : MUYA_VERSION
  constructor (options) {
    this.options = options
  }
}

export default Muya
