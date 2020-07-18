import ScrollPage from '@/block'
import Selection from '@/selection'
import Search from '@/search'
import History from '@/history'
import JSONState from '@/jsonState'
import InlineRenderer from '@/inlineRenderer'
import * as otText from 'ot-text-unicode'

const hasPick = c => c && (c.p != null || c.r !== undefined)

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
    const { muya } = this
    // console.log(JSON.stringify(operations, null, 2))
    this.jsonState.dispatch(operations, source)

    // Codes bellow are copy from `ot-json1.apply`
    if (operations === null) {
      return
    }

    // Phase 1: Pick. Returns updated subdocument.
    function pick (subDoc, descent) {
      const stack = []

      let i = 0

      for (; i < descent.length; i++) {
        const d = descent[i]
        if (Array.isArray(d)) break
        if (typeof d === 'object') continue
        stack.push(subDoc)
        // Its valid to descend into a null space - just we can't pick there.
        subDoc = subDoc == null ? undefined : subDoc.queryBlock([d])
      }

      // Children. These need to be traversed in reverse order here.
      for (let j = descent.length - 1; j >= i; j--) {
        subDoc = pick(subDoc, descent[j])
      }

      // Then back again.
      for (--i; i >= 0; i--) {
        const d = descent[i]
        if (typeof d !== 'object') {
          const container = stack.pop()
          if ((subDoc === (container == null ? undefined : container.queryBlock([d])))) {
            subDoc = container
          } else {
            if (subDoc === undefined) {
              container.find(d).remove('api')
              subDoc = container
            } else {
              container.find(d).replaceWith(subDoc, 'api')
              subDoc = container
            }
          }
        } else if (hasPick(d)) {
          subDoc = undefined
        }
      }

      return subDoc
    }

    const snapshot = pick(this.scrollPage, operations)

    function drop (root, descent) {
      let subDoc = root; let i = 0 // For reading
      const rootContainer = { root } // This is an avoidable allocation.
      let m = 0
      let container = rootContainer
      let key = 'root' // For writing

      function mut () {
        for (; m < i; m++) {
          const d = descent[m]
          if (typeof d === 'object') continue
          container = key === 'root' ? container[key] : container.queryBlock([key])
          key = d
        }
      }

      for (; i < descent.length; i++) {
        const d = descent[i]

        if (Array.isArray(d)) {
          const child = drop(subDoc, d)
          if (child !== subDoc && child !== undefined) {
            mut()
            subDoc = container[key] = child
          }
        } else if (typeof d === 'object') {
          if (d.i !== undefined) { // Insert
            mut()
            const ref = container.find(key)
            const newBlock = ScrollPage.loadBlock(d.i.name).create(muya, d.i)
            container.insertBefore(newBlock, ref, 'api')

            subDoc = container
          }

          if (d.es) { // Edit. Ok because its illegal to drop inside mixed region
            mut()
            container = container.queryBlock(['text'])
            container._text = otText.type.apply(container.text, d.es)
            container.update()
            subDoc = container
          }
        } else {
          subDoc = subDoc != null ? subDoc.queryBlock([d]) : undefined
        }
      }

      return rootContainer.root
    }

    drop(snapshot, operations)
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
