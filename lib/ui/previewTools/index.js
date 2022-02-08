import BaseFloat from '../baseFloat'
import { throttle } from '@/utils'
import ScrollPage from '@/block'
import { patch, h } from '@/utils/snabbdom'
import ICONS from './config'
import { BLOCK_DOM_PROPERTY } from '@/config'

import './index.css'

const defaultOptions = {
  placement: 'left-start',
  modifiers: {
    offset: {
      offset: '5, -95'
    }
  },
  showArrow: false
}

class PreviewTools extends BaseFloat {
  static pluginName = 'previewTools'

  constructor (muya, options = {}) {
    const name = 'mu-preview-tools'
    const opts = Object.assign({}, defaultOptions, options)
    super(muya, name, opts)
    this.oldVnode = null
    this.block = null
    this.options = opts
    const iconContainer = this.iconContainer = document.createElement('div')
    this.container.appendChild(iconContainer)
    this.floatBox.classList.add('mu-preview-tools-container')
    this.listen()
  }

  listen () {
    const { eventCenter } = this.muya
    super.listen()

    const handler = throttle(event => {
      const { x, y } = event
      const eles = [...document.elementsFromPoint(x, y)]
      const container = [...eles].find(ele => ele[BLOCK_DOM_PROPERTY] && /html-block|math-block/.test(ele[BLOCK_DOM_PROPERTY].blockName))
      if (container && !container[BLOCK_DOM_PROPERTY].active) {
        const block = container[BLOCK_DOM_PROPERTY]
        if (block.blockName === 'html-block' && this.muya.options.disableHtml) {
          return this.hide()
        }
        this.block = block
        this.show(container)
        this.render()
      } else {
        this.hide()
      }
    }, 300)

    eventCenter.attachDOMEvent(document.body, 'mousemove', handler)
  }

  render () {
    const { iconContainer, oldVnode } = this
    const children = ICONS.map(i => {
      let icon
      let iconWrapperSelector
      if (i.icon) {
        // SVG icon Asset
        iconWrapperSelector = 'div.icon-wrapper'
        icon = h('i.icon', h('i.icon-inner', {
          style: {
            background: `url(${i.icon}) no-repeat`,
            'background-size': '100%'
          }
        }, ''))
      }
      const iconWrapper = h(iconWrapperSelector, icon)

      const itemSelector = `li.item.${i.type}`

      return h(itemSelector, {
        attrs: {
          title: `${i.tooltip}`
        },
        on: {
          click: event => {
            this.selectItem(event, i)
          }
        }
      }, [iconWrapper])
    })

    const vnode = h('ul', children)

    if (oldVnode) {
      patch(oldVnode, vnode)
    } else {
      patch(iconContainer, vnode)
    }

    this.oldVnode = vnode
  }

  selectItem (event, i) {
    event.preventDefault()
    const { block } = this
    switch (i.type) {
      case 'edit': {
        block.firstContentInDescendant().setCursor(0, 0)
        break
      }

      case 'delete': {
        const state = {
          name: 'paragraph',
          text: ''
        }

        const newBlock = ScrollPage.loadBlock('paragraph').create(this.muya, state)
        block.replaceWith(newBlock)
        newBlock.firstContentInDescendant().setCursor(0, 0)
        break
      }
    }

    this.hide()
  }
}

export default PreviewTools
