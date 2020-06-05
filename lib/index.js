import EventCenter from '@/event'
import Editor from '@/editor'

class Muya {
  static version = typeof MUYA_VERSION === 'undefined' ? 'dev' : MUYA_VERSION

  constructor (options) {
    this.options = options
    this.event = new EventCenter()
    this.editor = new Editor(this)
  }
}

export default Muya
