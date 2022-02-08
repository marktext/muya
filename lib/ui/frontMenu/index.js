import BaseFloat from '@/ui/baseFloat'
import { patch, h } from '@/utils/snabbdom'
import { deepCopy } from '@/utils'
import emptyStates from '@/config/emptyStates'
import ScrollPage from '@/block/scrollPage'
import { FRONT_MENU, canTurnIntoMenu } from './config'
import { replaceBlockByLabel } from '@/ui/quickInsert/config'

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
    this.isHover = false
    const frontMenuContainer = this.frontMenuContainer = document.createElement('div')
    Object.assign(this.container.parentNode.style, {
      overflow: 'visible'
    })
    this.container.appendChild(frontMenuContainer)
    this.listen()
  }

  listen () {
    const { container } = this
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
      } else if (!this.isHover) {
        this.hide()
        this.isHover = false
        this.reference = null
      }
    })

    const enterLeaveHandler = event => {
      if (event.type === 'mouseleave') {
        this.hide()
        this.isHover = false
        this.reference = null
      } else {
        this.isHover = true
      }
    }

    eventCenter.attachDOMEvent(container, 'mouseenter', enterLeaveHandler)
    eventCenter.attachDOMEvent(container, 'mouseleave', enterLeaveHandler)
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
    const { block, muya } = this
    const oldState = block.getState()
    let cursorBlock = null
    let state = null
    const {
      bulletListMarker,
      orderListDelimiter
    } = muya.options

    if (/duplicate|new|delete/.test(label)) {
      switch (label) {
        case 'duplicate': {
          state = deepCopy(oldState)
          const dupBlock = ScrollPage.loadBlock(state.name).create(muya, state)
          block.parent.insertAfter(dupBlock, block)
          cursorBlock = dupBlock.lastContentInDescendant()
          break
        }

        case 'new': {
          state = deepCopy(emptyStates.paragraph)
          const newBlock = ScrollPage.loadBlock('paragraph').create(muya, state)
          block.parent.insertAfter(newBlock, block)
          cursorBlock = newBlock.lastContentInDescendant()
          break
        }

        case 'delete': {
          if (block.prev) {
            cursorBlock = block.prev.lastContentInDescendant()
          } else if (block.next) {
            cursorBlock = block.next.firstContentInDescendant()
          } else {
            state = deepCopy(emptyStates.paragraph)
            const newBlock = ScrollPage.loadBlock('paragraph').create(muya, state)
            block.parent.insertAfter(newBlock, block)
            cursorBlock = newBlock.lastContentInDescendant()
          }
          block.remove()
        }
      }
    } else {
      switch (block.blockName) {
        case 'paragraph':

        case 'atx-heading': {
          if (block.blockName === 'paragraph' && block.blockName === label) {
            break
          }

          if (block.blockName === 'atx-heading' && label.split(' ')[1] === String(oldState.meta.level)) {
            break
          }
          const rawText = oldState.text
          const text = block.blockName === 'paragraph' ? rawText : rawText.replace(/^ {0,3}#{1,6}(?:\s{1,}|$)/, '')
          replaceBlockByLabel({
            block,
            label,
            muya,
            text
          })
          break
        }

        case 'order-list':

        case 'bullet-list':

        case 'task-list': {
          if (block.blockName === label) {
            break
          }
          state = deepCopy(oldState)
          if (block.blockName === 'task-list') {
            state.children.forEach(listItem => {
              listItem.name = 'list-item'
              delete listItem.meta
            })
          }
          const { loose, delimiter = orderListDelimiter, marker = bulletListMarker } = state.meta
          if (label === 'task-list') {
            state.children.forEach(listItem => {
              listItem.name = 'task-list-item'
              listItem.meta = {
                checked: false
              }
            })
            state.meta = {
              marker,
              loose
            }
          } else if (label === 'order-list') {
            state.meta = {
              delimiter,
              loose
            }
          } else {
            state.meta = {
              marker,
              loose
            }
          }
          const { path, start, end } = muya.editor.selection
          const listBlock = ScrollPage.loadBlock(label).create(muya, state)
          block.replaceWith(listBlock)
          const guessCursorBlock = muya.editor.scrollPage.queryBlock(path)
          if (guessCursorBlock) {
            guessCursorBlock.setCursor(start.offset, end.offset, true)
          } else {
            cursorBlock = listBlock.firstContentInDescendant()
          }
          break
        }
      }
    }

    if (cursorBlock) {
      cursorBlock.setCursor(0, 0, true)
    }
    // Delay hide to avoid dispatch enter hander
    setTimeout(this.hide.bind(this))
    this.isHover = false
  }
}

export default FrontMenu
