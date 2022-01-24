import Fuse from 'fuse.js'
import { patch, h } from '@/utils/snabbdom'
import { deepCopy, deepCopyArray } from '@/utils'
import BaseScrollFloat from '@/ui/baseScrollFloat'
import { MENU_CONFIG } from './config'
import emptyStates from '@/config/emptyStates'
import ScrollPage from '@/block/scrollPage'
import logger from '@/utils/logger'

import './index.css'

const debug = logger('quickinsert:')

const checkCanInsertFrontMatter = (muya, block) => {
  const { frontMatter } = muya.options

  return frontMatter && !block.parent.prev && block.parent.parent.blockName === 'scrollpage'
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

    this.renderArray = data.flatMap(d => d.children)
    if (this.renderArray.length > 0) {
      this.activeItem = this.renderArray[0]
      const activeEle = this.getItemElement(this.activeItem)
      this.activeEleScrollIntoView(activeEle)
    }
  }

  listen () {
    super.listen()
    const { eventCenter } = this.muya
    eventCenter.subscribe('muya-quick-insert', ({ reference, block, status }) => {
      if (status) {
        this.block = block
        this.show(reference)
        this.search(block.text.substring(1)) // remove `/` char
      } else {
        this.hide()
      }
    })
  }

  render () {
    const { scrollElement, activeItem, renderData } = this
    let children = renderData
      .map(section => {
        const titleVnode = h('div.title', section.name.toUpperCase())
        const items = []

        for (const item of section.children) {
          const { title, subTitle, label, icon, shortCut } = item
          const iconVnode = h('div.icon-container', h('i.icon', h(`i.icon-${label.replace(/\s/g, '-')}`, {
            style: {
              background: `url(${icon}) no-repeat`,
              'background-size': '100%'
            }
          }, '')))

          const description = h('div.description', [
            h('div.big-title', title),
            h('div.sub-title', subTitle)
          ])
          const shortCutVnode = h('div.short-cut', [
            h('span', shortCut)
          ])
          const selector = activeItem.label === label ? 'div.item.active' : 'div.item'
          items.push(h(selector, {
            dataset: { label },
            on: {
              click: () => {
                this.selectItem(item)
              }
            }
          }, [iconVnode, description, shortCutVnode]))
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
      menuConfig.find(menu => menu.name === 'basic block').children.splice(2, 1)
    }
    let result = menuConfig
    if (text !== '') {
      result = []

      for (const menu of menuConfig) {
        const fuse = new Fuse(menu.children, {
          includeScore: true,
          keys: ['title']
        })
        const match = fuse.search(text).map(i => ({ score: i.score, ...i.item }))
        if (match.length) {
          result.push({
            name: menu.name,
            children: match
          })
        }
      }

      if (result.length) {
        result.sort((a, b) => a.children[0].score < b.children[0].score ? -1 : 1)
      }
    }
    this.renderData = result
    this.render()
  }

  selectItem (item) {
    const { label } = item
    const { block, muya } = this
    const {
      preferLooseListItem,
      bulletListMarker,
      orderListDelimiter,
      frontmatterType
    } = muya.options
    let newBlock = null
    let state = null

    switch (label) {
      case 'paragraph':

      case 'thematic-break':

      case 'table':

      case 'math-block':

      case 'html-block':

      case 'code-block':

      case 'block-quote':
        newBlock = ScrollPage.loadBlock(label).create(muya, deepCopy(emptyStates[label]))
        break

      case 'frontmatter':
        state = deepCopy(emptyStates.frontmatter)
        state.meta.type = frontmatterType
        state.meta.lang = /\+-/.test(frontmatterType) ? 'yaml' : 'json'
        newBlock = ScrollPage.loadBlock(label).create(muya, state)
        break

      case 'atx-heading 1':

      case 'atx-heading 2':

      case 'atx-heading 3':

      case 'atx-heading 4':

      case 'atx-heading 5':

      case 'atx-heading 6':
        state = deepCopy(emptyStates['atx-heading'])
        // eslint-disable-next-line no-case-declarations
        const [blockName, level] = label.split(' ')
        state.meta.level = level
        state.text = '#'.repeat(+level) + ' '
        newBlock = ScrollPage.loadBlock(blockName).create(muya, state)
        break

      case 'order-list':
        state = deepCopy(emptyStates[label])
        state.meta.loose = preferLooseListItem
        state.meta.delimiter = orderListDelimiter
        newBlock = ScrollPage.loadBlock(label).create(muya, state)
        break

      case 'bullet-list':

      case 'task-list':
        state = deepCopy(emptyStates[label])
        state.meta.loose = preferLooseListItem
        state.meta.marker = bulletListMarker
        newBlock = ScrollPage.loadBlock(label).create(muya, state)
        break

      case 'diagram vega-lite':

      case 'diagram flowchart':

      case 'diagram sequence':

      case 'diagram mermaid':

      case 'diagram plantuml':
        state = deepCopy(emptyStates.diagram)
        // eslint-disable-next-line no-case-declarations
        const [name, type] = label.split(' ')
        state.meta.type = type
        state.meta.lang = type === 'vega-lite' ? 'json' : 'ymal'
        newBlock = ScrollPage.loadBlock(name).create(muya, state)
        break

      default:
        debug.log('Unknow label in quick insert')
        break
    }

    block.parent.replaceWith(newBlock)
    if (label === 'thematic-break') {
      const nextParagraphBlock = ScrollPage.loadBlock('paragraph').create(muya, deepCopy(emptyStates.paragraph))
      newBlock.parent.insertAfter(nextParagraphBlock, newBlock)
      const cursorBlock = nextParagraphBlock.firstContentInDescendant()
      cursorBlock.setCursor(0, 0, true)
    } else {
      const cursorBlock = newBlock.firstContentInDescendant()
      // Set the cursor between <div>\n\n</div> when create html-block
      const offset = label === 'html-block' ? 6 : cursorBlock.text.length
      cursorBlock.setCursor(offset, offset, true)
    }
    // delay hide to avoid dispatch enter hander
    setTimeout(this.hide.bind(this))
  }

  getItemElement (item) {
    const { label } = item

    return this.scrollElement.querySelector(`[data-label="${label}"]`)
  }
}

export default QuickInsert
