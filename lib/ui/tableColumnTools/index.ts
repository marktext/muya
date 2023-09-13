// @ts-nocheck
import BaseFloat from '../baseFloat'
import { patch, h } from '@muya/utils/snabbdom'
import { throttle } from '@muya/utils'
import icons from './config'
import { BLOCK_DOM_PROPERTY } from '@muya/config'

import './index.css'

interface IIcon {
  type: string;
  tooltip: string;
  icon: string;
}

const OFFSET = 27

const defaultOptions = {
  placement: 'top',
  modifiers: {
    offset: {
      offset: '0, 0'
    }
  },
  showArrow: false
}

class TableColumnTools extends BaseFloat {
  public oldVnode: any;
  public block: any;
  public icons: Array<IIcon>;
  public toolsContainer: HTMLDivElement;

  static pluginName = 'tableColumnTools'

  constructor (muya, options = {}) {
    const name = 'mu-table-column-tools'
    const opts = Object.assign({}, defaultOptions, options)
    super(muya, name, opts)
    this.oldVnode = null
    this.block = null
    this.options = opts
    this.icons = icons
    const toolsContainer = this.toolsContainer = document.createElement('div')
    this.container.appendChild(toolsContainer)
    this.floatBox.classList.add('mu-table-column-tools-container')
    this.listen()
  }

  listen () {
    const { eventCenter } = this.muya
    super.listen()

    const handler = throttle(event => {
      const { x, y } = event
      const eles = [...document.elementsFromPoint(x, y)]
      const bellowEles = [...document.elementsFromPoint(x, y + OFFSET)]
      const hasTableCell = eles => {
        return eles.some(ele => ele[BLOCK_DOM_PROPERTY] && ele[BLOCK_DOM_PROPERTY].blockName === 'table.cell')
      }
      

      if (!hasTableCell(eles) && hasTableCell(bellowEles)) {
        // No need to show table column tools when format tool bar is shown. or the table column tools will show on the top of format toolbar.
        const { ui } = this.muya
        for (const { name, status } of ui.shownFloat) {
          if (name === 'mu-format-picker' && status) {
            return this.hide()
          }
        }
        const tableCellEle = bellowEles.find(ele => ele[BLOCK_DOM_PROPERTY] && ele[BLOCK_DOM_PROPERTY].blockName === 'table.cell')
        const cellBlock = tableCellEle[BLOCK_DOM_PROPERTY]
        this.block = cellBlock
        this.show(tableCellEle)
        this.render()
      } else {
        this.hide()
      }
    }, 300)

    eventCenter.attachDOMEvent(document.body, 'mousemove', handler)
  }

  render () {
    const { icons, oldVnode, toolsContainer, block } = this
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
      if (block.align === i.type) {
        itemSelector += '.active'
      }

      if (i.type === 'remove') {
        itemSelector += '.delete'
      }

      return h(itemSelector, {
        attrs: {
          title: `${i18n.t(i.tooltip)}`
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
      patch(toolsContainer, vnode)
    }

    this.oldVnode = vnode
  }

  selectItem (event, item) {
    event.preventDefault()
    event.stopPropagation()

    const { block } = this
    const offset = block.parent.offset(block)
    const { table, row } = block
    const columnCount = row.offset(this.block)

    switch (item.type) {
      case 'remove': {
        block.table.removeColumn(offset)

        return this.hide()
      }

      case 'insert left':

      case 'insert right': {
        const offset = item.type === 'insert left' ? columnCount : columnCount + 1
        const cursorBlock = table.insertColumn(offset)
        if (cursorBlock) {
          cursorBlock.setCursor(0, 0)
        }

        return this.hide()
      }

      default:
        block.table.alignColumn(offset, item.type)

        return this.render()
    }
  }
}

export default TableColumnTools
