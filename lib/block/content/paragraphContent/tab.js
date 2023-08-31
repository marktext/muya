import ScrollPage from '@muya/block'
import { tokenizer } from '@muya/inlineRenderer/lexer'

const BOTH_SIDES_FORMATS = [
  'strong',
  'em',
  'inline_code',
  'image',
  'link',
  'reference_image',
  'reference_link',
  'emoji',
  'del',
  'html_tag',
  'inline_math'
]

export default {
  isUnindentableListItem () {
    const { parent } = this
    const listItem = parent.parent
    const list = listItem?.parent
    const listParent = list?.parent

    if (!this.isCollapsed) {
      return false
    }

    if (listParent && (listParent.blockName === 'list-item' || listParent.blockName === 'task-list-item')) {
      return list.prev ? 'INDENT' : 'REPLACEMENT'
    }

    return false
  },

  isIndentableListItem () {
    const { parent } = this
    if (parent.blockName !== 'paragraph' || !parent.parent) {
      return false
    }

    const listItem = parent?.parent
    // Now we know it's a list item. Check whether we can indent the list item.
    const list = listItem?.parent

    if ((listItem.blockName !== 'list-item' && listItem.blockName !== 'task-list-item') || !this.isCollapsed) {
      return false
    }

    return list && /ol|ul/.test(list.tagName) && listItem.prev
  },

  unindentListItem (type) {
    const { parent } = this
    const listItem = parent?.parent
    const list = listItem?.parent
    const listParent = list?.parent
    const { start, end } = this.getCursor()
    const cursorParagraphOffset = listItem.offset(parent)

    if (type === 'REPLACEMENT') {
      const paragraph = parent.clone()
      list.parent.insertBefore(paragraph, list)

      if (listItem.isOnlyChild()) {
        list.remove()
      } else {
        listItem.remove()
      }
    } else if (type === 'INDENT') {
      const newListItem = listItem.clone()
      listParent.parent.insertAfter(newListItem, listParent)

      if ((listItem.next || list.next) && newListItem.lastChild.blockName !== list.blockName) {
        const state = {
          name: list.blockName,
          meta: { ...list.meta },
          children: []
        }
        const childList = ScrollPage.loadBlock(state.name).create(this.muya, state)
        newListItem.append(childList, 'user')
      }

      if (listItem.next) {
        const offset = list.offset(listItem)
        list.forEachAt(offset + 1, undefined, node => {
          newListItem.lastChild.append(node.clone(), 'user')
          node.remove()
        })
      }

      if (list.next) {
        const offset = listParent.offset(list)
        listParent.forEachAt(offset + 1, undefined, node => {
          newListItem.lastChild.append(node.clone(), 'user')
          node.remove()
        })
      }

      if (listItem.isOnlyChild()) {
        list.remove()
      } else {
        listItem.remove()
      }

      const cursorBlock = newListItem.find(cursorParagraphOffset).firstContentInDescendant()
      cursorBlock.setCursor(start.offset, end.offset, true)
    }
  },

  indentListItem () {
    const { parent, muya } = this
    const listItem = parent?.parent
    const list = listItem?.parent
    const prevListItem = listItem?.prev
    const { start, end } = this.getCursor()
    // Remember the offset of cursor paragraph in listItem
    const offset = listItem.offset(parent)

    // Search for a list in previous block
    let newList = prevListItem?.lastChild

    if (!newList || !/ol|ul/.test(newList.tagName)) {
      const state = {
        name: list.blockName,
        meta: { ...list.meta },
        children: [listItem.getState()]
      }
      newList = ScrollPage.loadBlock(state.name).create(muya, state)
      prevListItem.append(newList, 'user')
    } else {
      newList.append(listItem.clone(), 'user')
    }

    listItem.remove()

    const cursorBlock = newList.lastChild.find(offset).firstContentInDescendant()
    cursorBlock.setCursor(start.offset, end.offset, true)
  },

  insertTab () {
    const { muya, text } = this
    const { tabSize } = muya.options
    const tabCharacter = String.fromCharCode(160).repeat(tabSize)
    const { start, end } = this.getCursor()

    if (this.isCollapsed) {
      this.text = text.substring(0, start.offset) + tabCharacter + text.substring(end.offset)
      const offset = start.offset + tabCharacter.length

      this.setCursor(offset, offset, true)
    }
  },

  checkCursorAtEndFormat () {
    const { offset } = this.getCursor().start
    // TODO: add labels in tokenizer...
    const { muya, text } = this
    const tokens = tokenizer(text, {
      hasBeginRules: false,
      options: muya.options
    })
    let result = null
    const walkTokens = tkns => {
      for (const token of tkns) {
        const { marker, type, range, children, srcAndTitle, hrefAndTitle, backlash, closeTag, isFullLink, label } = token
        const { start, end } = range

        if (BOTH_SIDES_FORMATS.includes(type) && offset > start && offset < end) {
          switch (type) {
            case 'strong':

            case 'em':

            case 'inline_code':

            case 'emoji':

            case 'del':

            case 'inline_math': {
              if (marker && offset === end - marker.length) {
                result = {
                  offset: marker.length
                }

                return
              }
              break
            }

            case 'image':

            case 'link': {
              const linkTitleLen = (srcAndTitle || hrefAndTitle).length
              const secondLashLen = backlash && backlash.second ? backlash.second.length : 0
              if (offset === end - 3 - (linkTitleLen + secondLashLen)) {
                result = {
                  offset: 2
                }

                return
              } else if (offset === end - 1) {
                result = {
                  offset: 1
                }

                return
              }
              break
            }

            case 'reference_image':

            case 'reference_link': {
              const labelLen = label ? label.length : 0
              const secondLashLen = backlash && backlash.second ? backlash.second.length : 0
              if (isFullLink) {
                if (offset === end - 3 - labelLen - secondLashLen) {
                  result = {
                    offset: 2
                  }

                  return
                } else if (offset === end - 1) {
                  result = {
                    offset: 1
                  }

                  return
                }
              } else if (offset === end - 1) {
                result = {
                  offset: 1
                }

                return
              }
              break
            }

            case 'html_tag': {
              if (closeTag && offset === end - closeTag.length) {
                result = {
                  offset: closeTag.length
                }

                return
              }
              break
            }
            default:
              break
          }
        }

        if (children && children.length) {
          walkTokens(children)
        }
      }
    }
    walkTokens(tokens)

    return result
  },

  tabHandler (event) {
    // disable tab focus
    event.preventDefault()

    const { start, end } = this.getCursor()
    if (!start || !end) {
      return
    }

    if (event.shiftKey) {
      const unindentType = this.isUnindentableListItem()

      if (unindentType) {
        this.unindentListItem(unindentType)
      }

      return
    }

    // Handle `tab` to jump to the end of format when the cursor is at the end of format content.
    if (this.isCollapsed) {
      const atEnd = this.checkCursorAtEndFormat()

      if (atEnd) {
        const offset = start.offset + atEnd.offset

        return this.setCursor(offset, offset, true)
      }
    }

    if (this.isIndentableListItem()) {
      return this.indentListItem()
    }

    return this.insertTab()
  }
}
