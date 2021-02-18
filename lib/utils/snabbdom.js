import { init } from 'snabbdom/init'
import { classModule } from 'snabbdom/modules/class'
import { attributesModule } from 'snabbdom/modules/attributes'
import { datasetModule } from 'snabbdom/modules/dataset'
import { propsModule } from 'snabbdom/modules/props'
import { styleModule } from 'snabbdom/modules/style'
import { eventListenersModule } from 'snabbdom/modules/eventlisteners'

import { h as sh } from 'snabbdom/h'
import { toVNode as sToVNode } from 'snabbdom/tovnode'

export const patch = init([
  classModule,
  attributesModule,
  styleModule,
  propsModule,
  datasetModule,
  eventListenersModule
])

export const h = sh
export const toVnode = sToVNode

export const toHTML = require('snabbdom-to-html') // helper function for convert vnode to HTML string
export const htmlToVNode = html => { // helper function for convert html to vnode
  const wrapper = document.createElement('div')
  wrapper.innerHTML = html

  return toVnode(wrapper).children
}
