import Muya from '../lib'

const container = document.querySelector('#editor')
const muya = new Muya(container)
window.muya = muya

muya.on('text-change', console.log.bind(console))
