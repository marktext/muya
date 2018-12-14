import EventCenter from './eventHandler/eventCenter'
import Editor from './core/editor'

class Muya extends EventCenter {
  static version = typeof MUYA_VERSION === 'undefined' ? 'dev' : MUYA_VERSION
  constructor (options) {
    this.options = options
    this.editor = new Editor(this)
  }
}

export default Muya
