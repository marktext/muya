class A {
  static version = typeof MUYA_VERSION === 'undefined' ? 'dev' : MUYA_VERSION
  constructor (options) {
    this.options = options
  }
}

export default A
