import Muya from '../lib'
import EmojiPicker from '../lib/ui/emojiPicker'
import FormatPicker from '../lib/ui/formatPicker'
// import ImagePicker from '../lib/ui/imagePicker'
import ImageSelector from '../lib/ui/imageSelector'
import ImageToolBar from '../lib/ui/imageToolbar'
import ImageTransformer from '../lib/ui/transformer'
import CodePicker from '../lib/ui/codePicker'

Muya.use(EmojiPicker)
Muya.use(FormatPicker)
// Muya.use(ImagePicker)
Muya.use(ImageSelector)
Muya.use(ImageToolBar)
Muya.use(ImageTransformer)
Muya.use(CodePicker)

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
