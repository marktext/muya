import BaseFloat from '../baseFloat'
import { throttle } from '@/utils'
import { BLOCK_DOM_PROPERTY } from '@/config'

import './index.css'

const OFFSET = 37

const leftOptions = {
  placement: 'left-center',
  modifiers: {
    offset: {
      offset: '0, 3'
    }
  },
  showArrow: false
}

const bottomOptions = {
  placement: 'bottom',
  modifiers: {
    offset: {
      offset: '0, 3'
    }
  },
  showArrow: false
}

class TableDragBar extends BaseFloat {
  static pluginName = 'tableDragBar'

  constructor (muya, options = {}) {
    const name = 'mu-table-drag-bar'
    const opts = Object.assign({}, bottomOptions, options)
    super(muya, name, opts)
    this.oldVnode = null
    this.block = null
    this.options = opts
    this.floatBox.classList.add('mu-table-drag-container')
    this.listen()
  }

  listen () {
    const { eventCenter } = this.muya
    super.listen()

    const handler = throttle(event => {
      const { x, y } = event
      const eles = [...document.elementsFromPoint(x, y)]
      const aboveEles = [...document.elementsFromPoint(x, y - OFFSET)]
      const rightEles = [...document.elementsFromPoint(x + OFFSET, y)]
      const hasTableCell = eles => {
        return eles.some(ele => ele[BLOCK_DOM_PROPERTY] && ele[BLOCK_DOM_PROPERTY].blockName === 'table.cell')
      }

      if (!hasTableCell(eles) && (hasTableCell(aboveEles) || hasTableCell(rightEles))) {
        const tableCellEle = [...aboveEles, ...rightEles].find(ele => ele[BLOCK_DOM_PROPERTY] && ele[BLOCK_DOM_PROPERTY].blockName === 'table.cell')
        const cellBlock = tableCellEle[BLOCK_DOM_PROPERTY]
        const barType = hasTableCell(aboveEles) ? 'bottom' : 'left'
        this.options = Object.assign({}, barType === 'left' ? leftOptions : bottomOptions)
        this.barType = barType
        this.block = cellBlock
        this.show(tableCellEle)
        this.render(barType)
      } else {
        this.hide()
      }
    })

    eventCenter.attachDOMEvent(document.body, 'mousemove', handler)
  }

  render (barType) {
    const { container } = this
    container.dataset.drag = barType
  }
}

export default TableDragBar
