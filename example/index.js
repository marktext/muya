import Muya from '../lib'
import EmojiPicker from '../lib/ui/emojiPicker'
import FormatPicker from '../lib/ui/formatPicker'

Muya.use(EmojiPicker)
Muya.use(FormatPicker)

const container = document.querySelector('#editor')
const muya = new Muya(container)

window.muya = muya

muya.init()

muya.on('json-change', changes => {
  console.log(JSON.stringify(muya.getState(), null, 2))
  console.log(JSON.stringify(changes, null, 2))
})

muya.on('selection-change', changes => {
  const { anchor, focus, path } = changes
  console.log(JSON.stringify([anchor.offset, focus.offset, path]))
})
