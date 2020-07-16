import ScrollPage from '@/block'
import Selection from '@/selection'
import Search from '@/search'
import History from '@/history'
import JSONState from '@/jsonState'
import InlineRenderer from '@/inlineRenderer'
import * as otText from 'ot-text-unicode'

class Editor {
  constructor (muya) {
    const state = muya.options.json || muya.options.markdown || ''
    this.muya = muya
    this.jsonState = new JSONState(muya, state)
    this.inlineRenderer = new InlineRenderer(muya)
    this.selection = new Selection(muya)
    this.search = new Search(muya)
    this.history = new History(muya)
    // TODO: Maybe should not place selectedImage here?
    this.selectedImage = null
  }

  init () {
    const { muya } = this
    const state = this.jsonState.getState()
    this.scrollPage = ScrollPage.create(muya, state)

    // TODO, the cursor maybe passed by muya options.cursor, and no need to find the first leaf block.
    const firstLeafBlock = this.scrollPage.firstContentInDescendant()

    const cursor = {
      path: firstLeafBlock.path,
      block: firstLeafBlock,
      anchor: {
        offset: 0
      },
      focus: {
        offset: 0
      }
    }

    if (firstLeafBlock.checkNeedRender(cursor)) {
      firstLeafBlock.update(cursor)
    }

    this.selection.setSelection(cursor)
    this.exportAPI()
  }

  updateContents (operations, source) {
    console.log(JSON.stringify(operations, null, 2))

    this.jsonState.dispatch(operations, source)
    // Update UI
    if (typeof operations[0] !== 'object') {
      operations = [operations]
    }

    const blockToBeRemove = []

    const process = (op, path) => {
      while (op.length) {
        const token = op.shift()
        if (typeof token === 'number' || typeof token === 'string') {
          path.push(token)
        } else if (typeof token === 'object') {
          switch (true) {
            case !!token.es: {
              const block = this.scrollPage.queryBlock(path)
              // Be careful, it's `_text`
              block._text = otText.type.apply(block.text, token.es)
              block.update()
              break
            }

            case !!token.r || !!token.i: {
              if (token.r) {
                const block = this.scrollPage.queryBlock(path)
                blockToBeRemove.push(block)
              }

              if (token.i) {
                const parentPath = path.slice(0, -1)
                if (typeof parentPath[parentPath.length - 1] === 'string') {
                  parentPath.pop()
                }
                const parent = this.scrollPage.queryBlock(parentPath)
                const lastIndex = path[path.length - 1]
                const ref = parent.find(lastIndex)
                const newBlock = ScrollPage.loadBlock(token.i.name).create(this.muya, token.i)
                parent.insertBefore(newBlock, ref, 'api')
              }
              break
            }

            case Array.isArray(token): {
              process(token, [...path]) // use [...path] to copy path
              break
            }
          }
        }
      }
    }

    for (const op of operations) {
      const path = []

      process(op, path)
    }

    if (blockToBeRemove.length) {
      for (const block of blockToBeRemove) {
        block.remove('api')
      }
    }
  }

  exportAPI () {
    const apis = {
      jsonState: ['getState', 'getMarkdown'],
      history: ['undo', 'redo']
    }

    Object.keys(apis).forEach(key => {
      for (const api of apis[key]) {
        this[api] = this[key][api].bind(this[key])
      }
    })
  }
}

export default Editor
