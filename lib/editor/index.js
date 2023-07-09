import ScrollPage from '@/block'
import Selection from '@/selection'
import Search from '@/search'
import History from '@/history'
import Clipboard from '@/clipboard'
import JSONState from '@/jsonState'
import InlineRenderer from '@/inlineRenderer'
import { hasPick } from '@/utils'
import * as otText from 'ot-text-unicode'
import logger from '@/utils/logger'

const debug = logger('editor:')

class Editor {
  constructor (muya) {
    const state = muya.options.json || muya.options.markdown || ''
    this.muya = muya
    this.jsonState = new JSONState(muya, state)
    this.inlineRenderer = new InlineRenderer(muya)
    this.selection = new Selection(muya)
    this.searchModule = new Search(muya)
    this.clipboard = new Clipboard(muya)
    this.history = new History(muya)
    // loaded languages in editor { key: lang, value: promise }
    this.loadedLanguages = new Map()
    // TODO: Maybe should not place selectedImage here?
    this.selectedImage = null
  }

  init () {
    const { muya } = this
    const state = this.jsonState.getState()
    this.scrollPage = ScrollPage.create(muya, state)
    this.focus()
    this.exportAPI()
  }

  focus () {
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

    if (firstLeafBlock.blockName === 'paragraph.content' && firstLeafBlock.checkNeedRender(cursor)) {
      firstLeafBlock.update(cursor)
    }

    this.selection.setSelection(cursor)
  }

  updateContents (operations, selection, source) {
    const { muya } = this
    this.jsonState.dispatch(operations, source)

    // Codes bellow are copy from `ot-json1.apply` and modified.
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
              // TODO: handler typeof d === 'string'
              typeof d === 'number' && container.find(d).remove('api')
              subDoc = container
            } else {
              typeof d === 'number' && container.find(d).replaceWith(subDoc, 'api')
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
      let subDoc = root
      let i = 0 // For reading
      let m = 0
      const rootContainer = { root } // This is an avoidable allocation.
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
            // It maybe never go into this if statement.
            subDoc = container[key] = child
          }
        } else if (typeof d === 'object') {
          if (d.i !== undefined) { // Insert
            mut()
            const ref = container.find(key)
            if (typeof key === 'number') {
              const newBlock = ScrollPage.loadBlock(d.i.name).create(muya, d.i)
              container.insertBefore(newBlock, ref, 'api')

              subDoc = newBlock
            } else {
              switch (key) {
                case 'checked': {
                  ref.update(d.i, 'api')
                  break
                }

                case 'meta':
                  // Do nothing.
                  break

                default:
                  debug.warn(`Unknow operation path ${key}`)
                  break
              }
            }
          }

          if (d.es) { // Edit. Ok because its illegal to drop inside mixed region
            mut()
            if (subDoc.blockName === 'table.cell') {
              subDoc.align = otText.type.apply(subDoc.align, d.es)
            } else if (subDoc.blockName === 'language-input') {
              subDoc._text = otText.type.apply(subDoc.text, d.es)
              subDoc.parent.meta.lang = subDoc.text
              subDoc.update()
            } else if (subDoc.blockName === 'code-block') {
              // Handle modify code block type.
              subDoc.meta.type = otText.type.apply(subDoc.meta.type, d.es)
            } else {
              subDoc._text = otText.type.apply(subDoc.text, d.es)
              subDoc.update()
            }
          }
        } else {
          subDoc = subDoc != null ? subDoc.queryBlock([d]) : undefined
        }
      }

      return rootContainer.root
    }

    drop(snapshot, operations)

    if (selection) {
      const { anchorPath, start, end, isSelectionInSameBlock } = selection
      const cursorBlock = this.scrollPage.queryBlock(anchorPath)

      if (cursorBlock && cursorBlock.isContentBlock && isSelectionInSameBlock) {
        cursorBlock.setCursor(start.offset, end.offset, true)
      }
    }
  }

  setContent (content, autoFocus = false) {
    this.jsonState.setContent(content)
    const state = this.jsonState.getState()

    this.scrollPage.updateState(state)
    this.history.clear()
    if (autoFocus) {
      this.focus()
    }
  }

  exportAPI () {
    const apis = {
      jsonState: ['getState', 'getMarkdown'],
      history: ['undo', 'redo'],
      searchModule: ['search', 'find', 'replace']
    }

    Object.keys(apis).forEach(key => {
      for (const api of apis[key]) {
        this[api] = this[key][api].bind(this[key])
      }
    })
  }
}

export default Editor
