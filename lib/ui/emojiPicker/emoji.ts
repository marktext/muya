// @ts-nocheck
import Fuse from "fuse.js";
import emojis from "@muya/config/emojis.json";

const emojisForSearch = {};

for (const emoji of emojis) {
  if (emojisForSearch[emoji.category]) {
    emojisForSearch[emoji.category].push(emoji);
  } else {
    emojisForSearch[emoji.category] = [emoji];
  }
}

class Emoji {
  private cache: Map<string, any>;

  constructor() {
    this.cache = new Map();
  }

  search(text) {
    const { cache } = this;
    if (cache.has(text)) return cache.get(text);
    const result = {};

    Object.keys(emojisForSearch).forEach((category) => {
      const fuse = new Fuse(emojisForSearch[category], {
        includeScore: true,
        keys: ["aliases", "tags"],
      });
      const list = fuse.search(text).map((i) => i.item);
      if (list.length) {
        result[category] = list;
      }
    });
    cache.set(text, result);

    return result;
  }

  destroy() {
    return this.cache.clear();
  }
}

export default Emoji;
