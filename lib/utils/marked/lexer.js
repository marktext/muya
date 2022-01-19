import { normal, gfm, pedantic } from './blockRules'
import options from './options'
import { splitCells, rtrim, getUniqueId } from './utils'

/**
 * Block Lexer
 */

function Lexer (opts) {
  this.tokens = []
  this.tokens.links = Object.create(null)
  this.tokens.footnotes = Object.create(null)
  this.footnoteOrder = 0
  this.options = Object.assign({}, options, opts)
  this.rules = normal

  if (this.options.pedantic) {
    this.rules = pedantic
  } else if (this.options.gfm) {
    this.rules = gfm
  }
}

/**
 * Preprocessing
 */

Lexer.prototype.lex = function (src) {
  src = src
    .replace(/\r\n|\r/g, '\n')
    .replace(/\t/g, '    ')
  this.checkFrontmatter = true
  this.footnoteOrder = 0
  this.token(src, true)

  // Move footnote token to the end of tokens.
  const { tokens } = this
  const hasNoFootnoteTokens = []
  const footnoteTokens = []
  let isInFootnote = false

  for (const token of tokens) {
    const { type } = token
    if (type === 'footnote_start') {
      isInFootnote = true
      footnoteTokens.push(token)
    } else if (type === 'footnote_end') {
      isInFootnote = false
      footnoteTokens.push(token)
    } else if (isInFootnote) {
      footnoteTokens.push(token)
    } else {
      hasNoFootnoteTokens.push(token)
    }
  }

  const result = [...hasNoFootnoteTokens, ...footnoteTokens]
  result.links = tokens.links
  result.footnotes = tokens.footnotes

  return result
}

/**
 * Lexing
 */

Lexer.prototype.token = function (src, top) {
  const {
    footnote,
    frontMatter,
    isGitlabCompatibilityEnabled,
    math
  } = this.options
  src = src.replace(/^ +$/gm, '')

  let loose
  let cap
  let bull
  let b
  let item
  let space
  let i
  let tag
  let l

  // Only check front matter at the begining of a markdown file.
  // Please see note in "blockquote" why we need "checkFrontmatter" and "top".
  if (frontMatter) {
    cap = this.rules.frontmatter.exec(src)
    if (this.checkFrontmatter && top && cap) {
      src = src.substring(cap[0].length)
      let lang
      let style
      let text
      if (cap[1]) {
        lang = 'yaml'
        style = '-'
        text = cap[1]
      } else if (cap[2]) {
        lang = 'toml'
        style = '+'
        text = cap[2]
      } else if (cap[3] || cap[4]) {
        lang = 'json'
        style = cap[3] ? ';' : '{'
        text = cap[3] || cap[4]
      }
      this.tokens.push({
        type: 'frontmatter',
        text,
        style,
        lang
      })
    }
    this.checkFrontmatter = false
  }

  while (src) {
    // newline
    cap = this.rules.newline.exec(src)
    if (cap) {
      src = src.substring(cap[0].length)
      if (cap[0].length > 1) {
        this.tokens.push({
          type: 'space'
        })
      }
    }

    // code
    // An indented code block cannot interrupt a paragraph.
    cap = this.rules.code.exec(src)
    if (cap) {
      const lastToken = this.tokens[this.tokens.length - 1]
      src = src.substring(cap[0].length)
      if (lastToken && lastToken.type === 'paragraph') {
        lastToken.text += `\n${cap[0].trimRight()}`
      } else {
        cap = cap[0].replace(/^ {4}/gm, '')
        this.tokens.push({
          type: 'code',
          codeBlockStyle: 'indented',
          text: !this.options.pedantic
            ? rtrim(cap, '\n')
            : cap
        })
      }
      continue
    }

    // multiple line math
    if (math) {
      cap = this.rules.multiplemath.exec(src)
      if (cap) {
        src = src.substring(cap[0].length)
        this.tokens.push({
          type: 'multiplemath',
          text: cap[1],
          mathStyle: ''
        })
        continue
      }

      // match GitLab display math blocks (```math)
      if (isGitlabCompatibilityEnabled) {
        cap = this.rules.multiplemathGitlab.exec(src)
        if (cap) {
          src = src.substring(cap[0].length)
          this.tokens.push({
            type: 'multiplemath',
            text: cap[2] || '',
            mathStyle: 'gitlab'
          })
          continue
        }
      }
    }

    // footnote
    if (footnote) {
      cap = this.rules.footnote.exec(src)
      if (top && cap) {
        src = src.substring(cap[0].length)
        const identifier = cap[1]
        this.tokens.push({
          type: 'footnote_start',
          identifier
        })

        // NOTE: Order is wrong if footnote identifier 1 is behind footnote identifier 2 in text.
        this.tokens.footnotes[identifier] = {
          order: ++this.footnoteOrder,
          identifier,
          footnoteId: getUniqueId()
        }

        /* eslint-disable no-useless-escape */
        // Remove the footnote identifer prefix. eg: `[^identifier]: `.
        cap = cap[0].replace(/^\[\^[^\^\[\]\s]+?(?<!\\)\]:\s*/gm, '')
        // Remove the four whitespace before each block of footnote.
        cap = cap.replace(/\n {4}(?=[^\s])/g, '\n')
        /* eslint-enable no-useless-escape */

        this.token(cap, top)

        this.tokens.push({
          type: 'footnote_end'
        })

        continue
      }
    }

    // fences
    cap = this.rules.fences.exec(src)
    if (cap) {
      src = src.substring(cap[0].length)
      const raw = cap[0]
      const text = indentCodeCompensation(raw, cap[3] || '')
      this.tokens.push({
        type: 'code',
        codeBlockStyle: 'fenced',
        lang: cap[2] ? cap[2].trim() : cap[2],
        text
      })
      continue
    }

    // heading
    cap = this.rules.heading.exec(src)
    if (cap) {
      src = src.substring(cap[0].length)
      let text = cap[2] ? cap[2].trim() : ''

      if (text.endsWith('#')) {
        const trimmed = rtrim(text, '#')

        if (this.options.pedantic) {
          text = trimmed.trim()
        } else if (!trimmed || trimmed.endsWith(' ')) {
          // CommonMark requires space before trailing #s
          text = trimmed.trim()
        }
      }

      this.tokens.push({
        type: 'heading',
        headingStyle: 'atx',
        depth: cap[1].length,
        text
      })
      continue
    }

    // table no leading pipe (gfm)
    cap = this.rules.nptable.exec(src)
    if (cap) {
      item = {
        type: 'table',
        header: splitCells(cap[1].replace(/^ *| *\| *$/g, '')),
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: cap[3] ? cap[3].replace(/\n$/, '').split('\n') : []
      }

      if (item.header.length === item.align.length) {
        src = src.substring(cap[0].length)

        for (i = 0; i < item.align.length; i++) {
          if (/^ *-+: *$/.test(item.align[i])) {
            item.align[i] = 'right'
          } else if (/^ *:-+: *$/.test(item.align[i])) {
            item.align[i] = 'center'
          } else if (/^ *:-+ *$/.test(item.align[i])) {
            item.align[i] = 'left'
          } else {
            item.align[i] = null
          }
        }

        for (i = 0; i < item.cells.length; i++) {
          item.cells[i] = splitCells(item.cells[i], item.header.length)
        }

        this.tokens.push(item)

        continue
      }
    }

    // hr
    cap = this.rules.hr.exec(src)
    if (cap) {
      const marker = cap[0].replace(/\n*$/, '')
      src = src.substring(cap[0].length)
      this.tokens.push({
        type: 'hr',
        marker
      })
      continue
    }

    // blockquote
    cap = this.rules.blockquote.exec(src)
    if (cap) {
      src = src.substring(cap[0].length)

      this.tokens.push({
        type: 'blockquote_start'
      })

      cap = cap[0].replace(/^ *> ?/gm, '')

      // Pass `top` to keep the current
      // "toplevel" state. This is exactly
      // how markdown.pl works.
      this.token(cap, top)

      this.tokens.push({
        type: 'blockquote_end'
      })

      continue
    }

    // NOTE: Complete list lexer part is a custom implementation based on an older marked.js version.

    // list
    cap = this.rules.list.exec(src)
    if (cap) {
      let checked
      src = src.substring(cap[0].length)
      bull = cap[2]
      let isOrdered = bull.length > 1
      this.tokens.push({
        type: 'list_start',
        ordered: isOrdered,
        listType: bull.length > 1 ? 'order' : (/^( {0,3})([-*+]) \[[xX ]\]/.test(cap[0]) ? 'task' : 'bullet'),
        start: isOrdered ? +(bull.slice(0, -1)) : ''
      })

      let next = false
      let prevNext = true
      let listItemIndices = []
      let isTaskList = false

      // Get each top-level item.
      cap = cap[0].match(this.rules.item)
      l = cap.length
      i = 0

      for (; i < l; i++) {
        const itemWithBullet = cap[i]
        item = itemWithBullet
        let newIsTaskListItem = false

        // Remove the list item's bullet so it is seen as the next token.
        space = item.length
        let newBull
        item = item.replace(/^ *([*+-]|\d+(?:\.|\))) {0,4}/, function (m, p1) {
          // Get and remove list item bullet
          newBull = p1 || bull

          return ''
        })

        const newIsOrdered = bull.length > 1 && /\d{1,9}/.test(newBull)
        if (!newIsOrdered && this.options.gfm) {
          checked = this.rules.checkbox.exec(item)
          if (checked) {
            checked = checked[1] === 'x' || checked[1] === 'X'
            newIsTaskListItem = true

            // Remove the list item's checkbox and adjust indentation by removing checkbox length.
            item = item.replace(this.rules.checkbox, '')
            space -= 4
          } else {
            checked = undefined
          }
        }

        if (i === 0) {
          isTaskList = newIsTaskListItem
        } else if (
          // Changing the bullet or ordered list delimiter starts a new list (CommonMark 264 and 265)
          //   - unordered, unordered --> bull !== newBull --> new list (e.g "-" --> "*")
          //   - ordered, ordered --> lastChar !== lastChar --> new list (e.g "." --> ")")
          //   - else --> new list (e.g. ordered --> unordered)
          i !== 0 &&
          (
            (!isOrdered && !newIsOrdered && bull !== newBull) ||
            (isOrdered && newIsOrdered && bull.slice(-1) !== newBull.slice(-1)) ||
            (isOrdered !== newIsOrdered) ||
            // Changing to/from task list item from/to bullet, starts a new list(work for marktext issue #870)
            // Because we distinguish between task list and bullet list in MarkText,
            // the parsing here is somewhat different from the commonmark Spec,
            // and the task list needs to be a separate list.
            (isTaskList !== newIsTaskListItem)
          )
        ) {
          this.tokens.push({
            type: 'list_end'
          })

          // Start a new list
          bull = newBull
          isOrdered = newIsOrdered
          isTaskList = newIsTaskListItem
          this.tokens.push({
            type: 'list_start',
            ordered: isOrdered,
            listType: bull.length > 1 ? 'order' : (/^( {0,3})([-*+]) \[[xX ]\]/.test(itemWithBullet) ? 'task' : 'bullet'),
            start: isOrdered ? +(bull.slice(0, -1)) : ''
          })
        }

        // Outdent whatever the
        // list item contains. Hacky.
        if (~item.indexOf('\n ')) {
          space -= item.length
          item = !this.options.pedantic
            ? item.replace(new RegExp('^ {1,' + space + '}', 'gm'), '')
            : item.replace(/^ {1,4}/gm, '')
        }

        // Determine whether the next list item belongs here.
        // Backpedal if it does not belong in this list.
        if (i !== l - 1) {
          b = this.rules.bullet.exec(cap[i + 1])[0]
          if (bull.length > 1
            ? b.length === 1
            : (b.length > 1 || (this.options.smartLists && b !== bull))) {
            src = cap.slice(i + 1).join('\n') + src
            i = l - 1
          }
        }

        let prevItem = ''
        if (i === 0) {
          prevItem = item
        } else {
          prevItem = cap[i - 1]
        }

        // Determine whether item is loose or not. If previous item is loose
        // this item is also loose.
        // A list is loose if any of its constituent list items are separated by blank lines,
        // or if any of its constituent list items directly contain two block-level elements with a blank line between them.
        // loose = next = next || /^ *([*+-]|\d{1,9}(?:\.|\)))( +\S+\n\n(?!\s*$)|\n\n(?!\s*$))/.test(itemWithBullet)
        loose = next = next || /\n\n(?!\s*$)/.test(item)
        // Check if previous line ends with a new line.
        if (!loose && (i !== 0 || l > 1) && prevItem.length !== 0 && prevItem.charAt(prevItem.length - 1) === '\n') {
          loose = next = true
        }

        // A list is either loose or tight, so update previous list items but not nested list items.
        if (next && prevNext !== next) {
          for (const index of listItemIndices) {
            this.tokens[index].type = 'loose_item_start'
          }
          listItemIndices = []
        }
        prevNext = next

        if (!loose) {
          listItemIndices.push(this.tokens.length)
        }

        const isOrderedListItem = /\d/.test(bull)
        this.tokens.push({
          checked,
          listItemType: bull.length > 1 ? 'order' : (isTaskList ? 'task' : 'bullet'),
          bulletMarkerOrDelimiter: isOrderedListItem ? bull.slice(-1) : bull.charAt(0),
          type: loose ? 'loose_item_start' : 'list_item_start'
        })

        if (/^\s*$/.test(item)) {
          this.tokens.push({
            type: 'text',
            text: ''
          })
        } else {
          // Recurse.
          this.token(item, false)
        }

        this.tokens.push({
          type: 'list_item_end'
        })
      }

      this.tokens.push({
        type: 'list_end'
      })
      continue
    }

    // html
    cap = this.rules.html.exec(src)
    if (cap) {
      src = src.substring(cap[0].length)
      this.tokens.push({
        type: this.options.sanitize
          ? 'paragraph'
          : 'html',
        pre: !this.options.sanitizer &&
          (cap[1] === 'pre' || cap[1] === 'script' || cap[1] === 'style'),
        text: this.options.sanitize ? (this.options.sanitizer ? this.options.sanitizer(cap[0]) : escape(cap[0])) : cap[0]
      })
      continue
    }

    // def
    cap = this.rules.def.exec(src)
    if (top && cap) {
      let text = ''
      do {
        src = src.substring(cap[0].length)
        if (cap[3]) cap[3] = cap[3].substring(1, cap[3].length - 1)
        tag = cap[1].toLowerCase().replace(/\s+/g, ' ')
        if (!this.tokens.links[tag]) {
          this.tokens.links[tag] = {
            href: cap[2],
            title: cap[3]
          }
        }

        text += cap[0]
        if (cap[0].endsWith('\n\n')) break
        cap = this.rules.def.exec(src)
      } while (cap)

      if (this.options.disableInline) {
        this.tokens.push({
          type: 'paragraph',
          text: text.replace(/\n*$/, '')
        })
      }
      continue
    }

    // table (gfm)
    cap = this.rules.table.exec(src)
    if (cap) {
      item = {
        type: 'table',
        header: splitCells(cap[1].replace(/^ *| *\| *$/g, '')),
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: cap[3] ? cap[3].replace(/\n$/, '').split('\n') : []
      }

      if (item.header.length === item.align.length) {
        src = src.substring(cap[0].length)

        for (i = 0; i < item.align.length; i++) {
          if (/^ *-+: *$/.test(item.align[i])) {
            item.align[i] = 'right'
          } else if (/^ *:-+: *$/.test(item.align[i])) {
            item.align[i] = 'center'
          } else if (/^ *:-+ *$/.test(item.align[i])) {
            item.align[i] = 'left'
          } else {
            item.align[i] = null
          }
        }

        for (i = 0; i < item.cells.length; i++) {
          item.cells[i] = splitCells(
            item.cells[i].replace(/^ *\| *| *\| *$/g, ''),
            item.header.length)
        }

        this.tokens.push(item)

        continue
      }
    }

    // lheading
    cap = this.rules.lheading.exec(src)
    if (cap) {
      const precededToken = this.tokens[this.tokens.length - 1]
      const chops = cap[0].trim().split(/\n/)
      const marker = chops[chops.length - 1]
      src = src.substring(cap[0].length)

      if (precededToken && precededToken.type === 'paragraph') {
        this.tokens.pop()
        this.tokens.push({
          type: 'heading',
          headingStyle: 'setext',
          depth: cap[2].charAt(0) === '=' ? 1 : 2,
          text: precededToken.text + '\n' + cap[1],
          marker
        })
      } else {
        this.tokens.push({
          type: 'heading',
          headingStyle: 'setext',
          depth: cap[2].charAt(0) === '=' ? 1 : 2,
          text: cap[1],
          marker
        })
      }
      continue
    }

    // top-level paragraph
    cap = this.rules.paragraph.exec(src)
    if (top && cap) {
      src = src.substring(cap[0].length)

      if (/^\[toc\]\n?$/i.test(cap[1])) {
        this.tokens.push({ type: 'toc', text: '[TOC]' })
        continue
      }

      this.tokens.push({
        type: 'paragraph',
        text: cap[1].charAt(cap[1].length - 1) === '\n'
          ? cap[1].slice(0, -1)
          : cap[1]
      })
      continue
    }

    // text
    cap = this.rules.text.exec(src)
    if (cap) {
      // Top-level should never reach here.
      src = src.substring(cap[0].length)
      this.tokens.push({
        type: 'text',
        text: cap[0]
      })
      continue
    }

    if (src) {
      throw new Error('Infinite loop on byte: ' + src.charCodeAt(0))
    }
  }
}

function indentCodeCompensation (raw, text) {
  const matchIndentToCode = raw.match(/^(\s+)(?:```)/)

  if (matchIndentToCode === null) {
    return text
  }

  const indentToCode = matchIndentToCode[1]

  return text
    .split('\n')
    .map(node => {
      const matchIndentInNode = node.match(/^\s+/)
      if (matchIndentInNode === null) {
        return node
      }

      const [indentInNode] = matchIndentInNode

      if (indentInNode.length >= indentToCode.length) {
        return node.slice(indentToCode.length)
      }

      return node
    })
    .join('\n')
}

export default Lexer
