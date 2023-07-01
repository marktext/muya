import Fuse from 'fuse.js'
import { patch, h } from '@/utils/snabbdom'
import { deepCopyArray } from '@/utils'
import BaseScrollFloat from '@/ui/baseScrollFloat'
import { MENU_CONFIG, replaceBlockByLabel } from './config'

import './index.css'

const checkCanInsertFrontMatter = (muya, block) => {
  const { frontMatter } = muya.options

  return (
    frontMatter &&
    !block.parent.prev &&
    block.parent.parent.blockName === 'scrollpage'
  )
}

class QuickInsert extends BaseScrollFloat {
  static pluginName = 'quickInsert'

  constructor (muya) {
    const name = 'mu-quick-insert'
    super(muya, name)
    this.reference = null
    this.oldVnode = null
    this._renderData = null
    this.renderArray = null
    this.activeItem = null
    this.block = null
    this.renderData = MENU_CONFIG
    this.render()
    this.listen()
  }

  get renderData () {
    return this._renderData
  }

  set renderData (data) {
    this._renderData = data

    this.renderArray = data.flatMap((d) => d.children)
    if (this.renderArray.length > 0) {
      this.activeItem = this.renderArray[0]
      const activeEle = this.getItemElement(this.activeItem)
      this.activeEleScrollIntoView(activeEle)
    }
  }

  listen () {
    super.listen()
    const { eventCenter } = this.muya
    eventCenter.subscribe(
      'muya-quick-insert',
      ({ reference, block, status }) => {
        if (status) {
          this.block = block
          this.show(reference)
          this.search(block.text.substring(1)) // remove `/` char
        } else {
          this.hide()
        }
      }
    )
  }

  render () {
    const { scrollElement, activeItem, renderData } = this
    let children = renderData.map((section) => {
      const titleVnode = h('div.title', section.name.toUpperCase())
      const items = []

      for (const item of section.children) {
        const { title, subTitle, label, icon, shortCut } = item
        const iconVnode = h(
          'div.icon-container',
          h(
            'i.icon',
            h(
              `i.icon-${label.replace(/\s/g, '-')}`,
              {
                style: {
                  background: `url(${icon}) no-repeat`,
                  'background-size': '100%'
                }
              },
              ''
            )
          )
        )

        const description = h('div.description', [
          h('div.big-title', {
            attrs: { title: subTitle }
          }, title)
        ])
        const shortCutVnode = h('div.short-cut', [h('span', shortCut)])
        const selector =
          activeItem.label === label ? 'div.item.active' : 'div.item'
        items.push(
          h(
            selector,
            {
              dataset: { label },
              on: {
                click: () => {
                  this.selectItem(item)
                }
              }
            },
            [iconVnode, description, shortCutVnode]
          )
        )
      }

      return h('section', [titleVnode, ...items])
    })

    if (children.length === 0) {
      children = h('div.no-result', 'No result')
    }
    const vnode = h('div', children)

    if (this.oldVnode) {
      patch(this.oldVnode, vnode)
    } else {
      patch(scrollElement, vnode)
    }
    this.oldVnode = vnode
  }

  search (text) {
    const { muya, block } = this
    const canInserFrontMatter = checkCanInsertFrontMatter(muya, block)
    const menuConfig = deepCopyArray(MENU_CONFIG)

    if (!canInserFrontMatter) {
      menuConfig
        .find((menu) => menu.name === 'basic blocks')
        .children.splice(2, 1)
    }
    let result = menuConfig
    if (text !== '') {
      result = []

      for (const menu of menuConfig) {
        const fuse = new Fuse(menu.children, {
          includeScore: true,
          keys: ['title']
        })
        const match = fuse
          .search(text)
          .map((i) => ({ score: i.score, ...i.item }))
        if (match.length) {
          result.push({
            name: menu.name,
            children: match
          })
        }
      }

      if (result.length) {
        result.sort((a, b) =>
          a.children[0].score < b.children[0].score ? -1 : 1
        )
      }
    }
    this.renderData = result
    this.render()
  }

  selectItem ({ label }) {
    const { block, muya } = this
    replaceBlockByLabel({
      label,
      block: block.parent,
      muya
    })
    // delay hide to avoid dispatch enter hander
    setTimeout(this.hide.bind(this))
  }

  getItemElement (item) {
    const { label } = item

    return this.scrollElement.querySelector(`[data-label="${label}"]`)
  }
}

export default QuickInsert
