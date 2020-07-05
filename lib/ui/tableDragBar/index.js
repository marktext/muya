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
    this.mouseTimer = null
    this.listen()
  }

  listen () {
    const { eventCenter } = this.muya
    const { container } = this
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
    eventCenter.attachDOMEvent(container, 'mousedown', this.mousedown)
    eventCenter.attachDOMEvent(container, 'mouseup', this.mouseup)
  }

  mousedown = (event) => {
    event.preventDefault()
    event.stopPropagation()
    this.mouseTimer = setTimeout(() => {
      this.startDrag(event)
      this.mouseTimer = null
    }, 300)
  }

  mouseup = (event) => {
    event.preventDefault()
    event.stopPropagation()
    const { container, barType } = this
    const { eventCenter } = this.muya
    if (this.mouseTimer) {
      clearTimeout(this.mouseTimer)
      this.mouseTimer = null
      console.log('click')
      eventCenter.emit('muya-table-bar', {
        reference: container,
        tableInfo: {
          barType
        },
        block: this.block
      })
    }
  }

  startDrag (event) {
    console.log(event)
  }

  render (barType) {
    const { container } = this
    container.dataset.drag = barType
  }
}

export default TableDragBar
