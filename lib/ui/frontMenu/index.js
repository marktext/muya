import BaseFloat from '@/ui/baseFloat'
import { patch, h } from '@/utils/snabbdom'
import { FRONT_MENU, canTurnIntoMenu } from './config'

import './index.css'

const renderIcon = ({ label, icon }) => h('i.icon', h(`i.icon-${label.replace(/\s/g, '-')}`, {
  style: {
    background: `url(${icon}) no-repeat`,
    'background-size': '100%'
  }
}, ''))

const defaultOptions = {
  placement: 'bottom',
  modifiers: {
    offset: {
      offset: '0, 10'
    }
  },
  showArrow: false
}

class FrontMenu extends BaseFloat {
  static pluginName = 'frontMenu'

  constructor (muya, options = {}) {
    const name = 'mu-front-menu'
    const opts = Object.assign({}, defaultOptions, options)
    super(muya, name, opts)
    this.oldVnode = null
    this.block = null
    this.options = opts
    this.reference = null
    const frontMenuContainer = this.frontMenuContainer = document.createElement('div')
    Object.assign(this.container.parentNode.style, {
      overflow: 'visible'
    })
    this.container.appendChild(frontMenuContainer)
    this.listen()
  }

  listen () {
    const { eventCenter } = this.muya
    super.listen()
    eventCenter.subscribe('muya-front-menu', ({ reference, block }) => {
      if (reference) {
        this.block = block
        this.reference = reference
        setTimeout(() => {
          this.show(reference)
          this.render()
        }, 0)
      } else {
        this.hide()
        this.reference = null
      }
    })

    const clickHander = event => {
      event.stopPropagation()
    }

    const docClickHander = event => {
      this.hide()
    }

    eventCenter.attachDOMEvent(this.container, 'click', clickHander)
    eventCenter.attachDOMEvent(document, 'click', docClickHander)
  }

  renderSubMenu (subMenu) {
    const { block } = this
    const children = subMenu.map(menuItem => {
      const { title, label, shortCut, subTitle } = menuItem
      const iconWrapperSelector = 'div.icon-wrapper'
      const iconWrapper = h(iconWrapperSelector, {
        props: {
          title: /diagram/.test(label) ? `${title}\n${subTitle}` : `${title}\n${shortCut}`
        }
      }, renderIcon(menuItem))

      let itemSelector = `div.turn-into-item.${label}`
      if (block.blockName === 'atx-heading') {
        if (label.startsWith(block.blockName) && label.endsWith(block.meta.level)) {
          itemSelector += '.active'
        }
      } else if (label === block.blockName) {
        itemSelector += '.active'
      }

      return h(itemSelector, {
        on: {
          click: event => {
            this.selectItem(event, { label })
          }
        }
      }, [iconWrapper])
    })
    const subMenuSelector = 'li.turn-into-menu'

    return h(subMenuSelector, children)
  }

  render () {
    const { oldVnode, frontMenuContainer, block } = this
    const { blockName } = block
    const children = FRONT_MENU.map(({ icon, label, text, shortCut }) => {
      const iconWrapperSelector = 'div.icon-wrapper'
      const iconWrapper = h(iconWrapperSelector, renderIcon({ icon, label }))
      const textWrapper = h('span.text', text)
      const shortCutWrapper = h('div.short-cut', [
        h('span', shortCut)
      ])
      const itemSelector = `li.item.${label}`
      const itemChildren = [iconWrapper, textWrapper, shortCutWrapper]

      return h(itemSelector, {
        on: {
          click: event => {
            this.selectItem(event, { label })
          }
        }
      }, itemChildren)
    })

    // Frontmatter can not be duplicated
    if (blockName === 'frontmatter') {
      children.splice(0, 1)
    }

    const subMenu = canTurnIntoMenu(block)
    if (subMenu.length) {
      const line = h('li.divider')
      children.unshift(line)
      children.unshift(this.renderSubMenu(subMenu))
    }

    const vnode = h('ul', children)

    if (oldVnode) {
      patch(oldVnode, vnode)
    } else {
      patch(frontMenuContainer, vnode)
    }
    this.oldVnode = vnode
  }

  selectItem (event, { label }) {
    event.preventDefault()
    event.stopPropagation()
    const { type, functionType } = this.block
    // front matter can not be duplicated.
    if (label === 'duplicate' && type === 'pre' && functionType === 'frontmatter') {
      return
    }
    const { contentState } = this.muya
    contentState.selectedBlock = null
    switch (label) {
      case 'duplicate': {
        contentState.duplicate()
        break
      }

      case 'delete': {
        contentState.deleteParagraph()
        break
      }

      case 'new': {
        contentState.insertParagraph('after', '', true)
        break
      }

      case 'turnInto':
        // do nothing, do not hide float box.
        return
      default:
        contentState.updateParagraph(label)
        break
    }
    // delay hide to avoid dispatch enter hander
    setTimeout(this.hide.bind(this))
  }
}

export default FrontMenu
