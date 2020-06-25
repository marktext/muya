import Parent from '@/block/base/parent'
import ScrollPage from '@/block/scrollPage'
import logger from '@/utils/logger'

const debug = logger('code:')

class Code extends Parent {
  static blockName = 'code'

  static create (muya, state) {
    const code = new Code(muya, state)

    code.append(ScrollPage.loadBlock('codeblock.content').create(muya, state))

    return code
  }

  get path () {
    const { path: pPath } = this.parent

    return [...pPath]
  }

  constructor (muya) {
    super(muya)
    this.tagName = 'code'
    this.classList = ['mu-code']
    this.createDomNode()
  }

  getState () {
    debug.warn('You can never call `getState` in code')
  }
}

export default Code
