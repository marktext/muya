import Muya from '../lib'

const container = document.querySelector('#editor')
const muya = new Muya(container)
window.muya = muya
muya.init()
muya.on('json-change', changes => {
  console.log(JSON.stringify(muya.getState(), null, 2))
  console.log(JSON.stringify(changes, null, 2))
})
