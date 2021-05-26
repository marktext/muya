import { filter } from 'fuzzaldrin-plus'
import emojis from '@/config/emojis.json'

const emojisForSearch = {}

for (const emoji of emojis) {
  const newEmoji = Object.assign({}, emoji, { search: [...emoji.aliases, ...emoji.tags].join(' ') })
  if (emojisForSearch[newEmoji.category]) {
    emojisForSearch[newEmoji.category].push(newEmoji)
  } else {
    emojisForSearch[newEmoji.category] = [newEmoji]
  }
}

class Emoji {
  constructor () {
    this.cache = new Map()
  }

  search (text) {
    const { cache } = this
    if (cache.has(text)) return cache.get(text)
    const result = {}

    Object.keys(emojisForSearch).forEach(category => {
      const list = filter(emojisForSearch[category], text, { key: 'search' })
      if (list.length) {
        result[category] = list
      }
    })
    cache.set(text, result)

    return result
  }

  destroy () {
    return this.cache.clear()
  }
}

export default Emoji
