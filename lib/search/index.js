import { DEFAULT_SEARCH_OPTIONS } from '@/config'
import { matchString, buildRegexValue } from '@/utils/search'

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
    const { start, end, block } = match
    const { text } = block

    block.text = text.substring(0, start) + value + text.substring(end)
  }

  replace (replaceValue, opt = { isSingle: true, isRegexp: false }) {
    const { isSingle, isRegexp, ...rest } = opt
    const options = Object.assign({}, DEFAULT_SEARCH_OPTIONS, rest)
    const { matches, value, index } = this

    if (matches.length) {
      if (isRegexp) {
        replaceValue = buildRegexValue(matches[index], replaceValue)
      }

      if (isSingle) {
        this.replaceOne(matches[index], replaceValue)
      } else {
        // replace all
        for (const match of matches) {
          this.replaceOne(match, replaceValue)
        }
      }
      const highlightIndex = index < matches.length - 1 ? index : index - 1

      this.search(value, { ...options, highlightIndex: isSingle ? highlightIndex : -1 })
    }

    return this
  }

  /**
   * Find preview or next value, and highlight it.
   * @param {string} action : previous or next.
   */
  find (action) {
    let { matches, index } = this
    const len = matches.length

    if (!len) {
      return
    }

    index = action === 'next' ? index + 1 : index - 1

    if (index < 0) {
      index = len - 1
    }

    if (index >= len) {
      index = 0
    }

    this.index = index

    this.updateMatches(true)
    this.updateMatches()

    return this
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
      const isActive = highlights.some(h => h.active)

      block.update(undefined, isClear ? [] : highlights)

      if (block.parent.active && !isActive) {
        block.blurHandler()
      }

      if (isActive && !isClear) {
        block.focusHandler()
      }
    }
  }

  /**
   * Search value in current document.
   * @param {string} value
   * @param {object} opts
   */
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
            matches.push(...strMatches.map(({ index, match, subMatches }) => {
              return {
                block,
                start: index,
                end: index + match.length,
                match,
                subMatches
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

    this.updateMatches()

    return this
  }
}

export default Search
