import BaseFloat from '../baseFloat'
import { patch, h } from '@/utils/snabbdom'
import icons from './config'

import './index.css'

const defaultOptions = {
  placement: 'top',
  modifiers: {
    offset: {
      offset: '0, 5'
    }
  },
  showArrow: false
}

class FormatPicker extends BaseFloat {
  static pluginName = 'formatPicker'

  constructor (muya, options = {}) {
    const name = 'mu-format-picker'
    const opts = Object.assign({}, defaultOptions, options)
    super(muya, name, opts)
    this.oldVnode = null
    this.block = null
    this.formats = null
    this.options = opts
    this.icons = icons
    const formatContainer = this.formatContainer = document.createElement('div')
    this.container.appendChild(formatContainer)
    this.floatBox.classList.add('mu-format-picker-container')
    this.listen()
  }

  listen () {
    const { eventCenter } = this.muya
    super.listen()
    eventCenter.subscribe('muya-format-picker', ({ reference, block }) => {
      if (reference) {
        this.block = block
        this.formats = block.getFormatsInRange().formats
        requestAnimationFrame(() => {
          this.show(reference)
          this.render()
        })
      } else {
        this.hide()
      }
    })
  }

  render () {
    const { icons, oldVnode, formatContainer, formats } = this
    const { i18n } = this.muya
    const children = icons.map(i => {
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

      let itemSelector = `li.item.${i.type}`
      if (formats.some(f => f.type === i.type || (f.type === 'html_tag' && f.tag === i.type))) {
        itemSelector += '.active'
      }

      return h(itemSelector, {
        attrs: {
          title: `${i18n.t(i.tooltip)}\n${i.shortcut}`
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
      patch(formatContainer, vnode)
    }
    this.oldVnode = vnode
  }

  selectItem (event, item) {
    event.preventDefault()
    event.stopPropagation()
    const { block, muya } = this
    const { start, end } = muya.editor.selection
    block.format(item.type, { start, end })
    if (/link|image/.test(item.type)) {
      this.hide()
    } else {
      const { formats } = block.getFormatsInRange()
      this.formats = formats
      this.render()
    }
  }
}

export default FormatPicker
