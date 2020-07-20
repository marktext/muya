import { DEFAULT_SEARCH_OPTIONS } from '@/config'
import { matchString } from '@/utils/search'

class Search {
  get scrollPage () {
    return this.muya.editor.scrollPage
  }

  constructor (muya, options = {}) {
    this.muya = muya
    this.options = options
    this.value = ''
    this.matches = []
    this.index = -1
  }

  replaceOne (match, value) {
    // TODO
  }

  replace (replaceValue, options = { isSingle: true }) {
    // TODO
  }

  find (action) {
    // TODO
  }

  updateMatches (isClear = false) {
    const { matches, index } = this
    let i
    const len = matches.length
    const matchesMap = new Map()

    for (i = 0; i < len; i++) {
      const { block, start, end } = matches[i]
      const active = i === index
      const highlight = { start, end, active }

      if (matchesMap.has(block)) {
        const highlights = matchesMap.get(block)
        highlights.push(highlight)
        matchesMap.set(block, highlights)
      } else {
        matchesMap.set(block, [highlight])
      }
    }

    for (const [block, highlights] of matchesMap.entries()) {
      block.update(undefined, isClear ? [] : highlights)
    }
  }

  search (value, opts = {}) {
    const matches = []
    const options = Object.assign({}, DEFAULT_SEARCH_OPTIONS, opts)
    const { highlightIndex } = options
    let index = -1

    // Empty last search.
    this.updateMatches(true)

    // Highlight current search.
    if (value) {
      this.scrollPage.depthFirstTraverse(block => {
        if (block.isContentBlock) {
          const { text } = block
          if (text && typeof text === 'string') {
            const strMatches = matchString(text, value, options)
            matches.push(...strMatches.map(m => {
              return {
                block,
                start: m.index,
                end: m.index + m.match.length
              }
            }))
          }
        }
      })
    }

    if (highlightIndex !== -1) {
      // If set the highlight index, then highlight the highlighIndex
      index = highlightIndex
    } else if (matches.length) {
      // highlight the first word that matches.
      index = 0
    }

    Object.assign(this, { value, matches, index })

    console.log(value, matches, index)
    this.updateMatches()

    return { value, matches, index }
  }
}

export default Search
