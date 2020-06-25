import ScrollPage from '@/block'
import Selection from '@/selection'
import { PARAGRAPH_STATE, THEMATIC_BREAK_STATE } from '@/config'

const INLINE_UPDATE_FRAGMENTS = [
  // '(?:^|\n) {0,3}([*+-] {1,4})', // Bullet list
  // '(?:^|\n)(\\[[x ]{1}\\] {1,4})', // Task list
  // '(?:^|\n) {0,3}(\\d{1,9}(?:\\.|\\)) {1,4})', // Order list
  '(?:^|\n) {0,3}(#{1,6})(?=\\s{1,}|$)', // ATX headings
  '^(?:[\\s\\S]+?)\\n {0,3}(\\={3,}|\\-{3,})(?= {1,}|$)', // Setext headings **match from beginning**
  '(?:^|\n) {0,3}(>).+', // Block quote
  '^( {4,})', // Indent code **match from beginning**
  // '^(\\[\\^[^\\^\\[\\]\\s]+?(?<!\\\\)\\]: )', // Footnote **match from beginning**
  '(?:^|\n) {0,3}((?:\\* *\\* *\\*|- *- *-|_ *_ *_)[ \\*\\-\\_]*)(?=\n|$)' // Thematic break
]

const INLINE_UPDATE_REG = new RegExp(INLINE_UPDATE_FRAGMENTS.join('|'), 'i')

export default {
  convertIfNeeded () {
    const { text } = this

    const [
      match, atxHeading, setextHeading, blockquote, indentedCodeBlock, thematicBreak
    ] = text.match(INLINE_UPDATE_REG) || []

    switch (true) {
      case (!!thematicBreak && new Set(thematicBreak.split('').filter(i => /\S/.test(i))).size === 1):
        this.convertToThematicBreak()
        break

      case !!atxHeading:
        this.convertToAtxHeading(atxHeading)
        break

      case !!setextHeading:
        this.convertToSetextHeading(setextHeading)
        break

      case !!blockquote:
        this.convertToBlockQuote(blockquote)
        break

      case !!indentedCodeBlock:
        this.convertToIndentedCodeBlock(indentedCodeBlock)
        break

      case !match:
      default:
        this.convertToParagraph()
        break
    }
  },

  // Thematic Break
  convertToThematicBreak () {
    // If the block is already thematic break, no need to update.
    if (this.parent.static.blockName === 'thematic-break') {
      return
    }
    const hasFocus = this.hasFocus
    const { start, end } = hasFocus ? Selection.getCursorOffsets(this.domNode) : {}
    const { text, muya } = this
    const lines = text.split('\n')
    const preParagraphLines = []
    let thematicLine = ''
    const postParagraphLines = []
    let thematicLineHasPushed = false

    for (const l of lines) {
      /* eslint-disable no-useless-escape */
      const THEMATIC_BREAK_REG = / {0,3}(?:\* *\* *\*|- *- *-|_ *_ *_)[ \*\-\_]*$/
      /* eslint-enable no-useless-escape */
      if (THEMATIC_BREAK_REG.test(l) && !thematicLineHasPushed) {
        thematicLine = l
        thematicLineHasPushed = true
      } else if (!thematicLineHasPushed) {
        preParagraphLines.push(l)
      } else {
        postParagraphLines.push(l)
      }
    }

    const newNodeState = Object.assign({}, THEMATIC_BREAK_STATE, {
      text: thematicLine
    })

    if (preParagraphLines.length) {
      const preParagraphState = Object.assign({}, PARAGRAPH_STATE, {
        text: preParagraphLines.join('\n')
      })
      const preParagraphBlock = ScrollPage.loadBlock(preParagraphState.name).create(muya, preParagraphState)
      this.parent.parent.insertBefore(preParagraphBlock, this.parent)
    }

    if (postParagraphLines.length) {
      const postParagraphState = Object.assign({}, PARAGRAPH_STATE, {
        text: postParagraphLines.join('\n')
      })
      const postParagraphBlock = ScrollPage.loadBlock(postParagraphState.name).create(muya, postParagraphState)
      this.parent.parent.insertAfter(postParagraphBlock, this.parent)
    }

    const thematicBlock = ScrollPage.loadBlock(newNodeState.name).create(muya, newNodeState)

    this.parent.replaceWith(thematicBlock)

    if (hasFocus) {
      const thematicBreakContent = thematicBlock.children.head
      const preParagraphTextLength = preParagraphLines.reduce((acc, i) => acc + i.length + 1, 0) // Add one, because the `\n`
      const startOffset = Math.max(0, start.offset - preParagraphTextLength)
      const endOffset = Math.max(0, end.offset - preParagraphTextLength)

      thematicBreakContent.setCursor(startOffset, endOffset, true)
    }
  },

  // ATX Heading
  convertToAtxHeading (atxHeading) {
    const level = atxHeading.length
    if (
      this.parent.static.blockName === 'atx-heading' &&
      this.parent.meta.level === level
    ) {
      return
    }

    const hasFocus = this.hasFocus
    const { start, end } = hasFocus ? Selection.getCursorOffsets(this.domNode) : {}
    const { text, muya } = this
    const lines = text.split('\n')
    const preParagraphLines = []
    let atxLine = ''
    const postParagraphLines = []
    let atxLineHasPushed = false

    for (const l of lines) {
      if (/^ {0,3}#{1,6}(?=\s{1,}|$)/.test(l) && !atxLineHasPushed) {
        atxLine = l
        atxLineHasPushed = true
      } else if (!atxLineHasPushed) {
        preParagraphLines.push(l)
      } else {
        postParagraphLines.push(l)
      }
    }

    if (preParagraphLines.length) {
      const preParagraphState = {
        name: 'paragraph',
        text: preParagraphLines.join('\n')
      }
      const preParagraphBlock = ScrollPage.loadBlock(preParagraphState.name).create(muya, preParagraphState)
      this.parent.parent.insertBefore(preParagraphBlock, this.parent)
    }

    if (postParagraphLines.length) {
      const postParagraphState = {
        name: 'paragraph',
        text: postParagraphLines.join('\n')
      }
      const postParagraphBlock = ScrollPage.loadBlock(postParagraphState.name).create(muya, postParagraphState)
      this.parent.parent.insertAfter(postParagraphBlock, this.parent)
    }

    const newNodeState = {
      name: 'atx-heading',
      meta: {
        level
      },
      text: atxLine
    }

    const atxHeadingBlock = ScrollPage.loadBlock(newNodeState.name).create(muya, newNodeState)

    this.parent.replaceWith(atxHeadingBlock)

    if (hasFocus) {
      const atxHeadingContent = atxHeadingBlock.children.head
      const preParagraphTextLength = preParagraphLines.reduce((acc, i) => acc + i.length + 1, 0) // Add one, because the `\n`
      const startOffset = Math.max(0, start.offset - preParagraphTextLength)
      const endOffset = Math.max(0, end.offset - preParagraphTextLength)
      atxHeadingContent.setCursor(startOffset, endOffset, true)
    }
  },

  // Setext Heading
  convertToSetextHeading (setextHeading) {
    const level = /=/.test(setextHeading) ? 2 : 1
    if (
      this.parent.static.blockName === 'setext-heading' &&
      this.parent.meta.level === level
    ) {
      return
    }

    const hasFocus = this.hasFocus
    const { text, muya } = this
    const lines = text.split('\n')
    const setextLines = []
    const postParagraphLines = []
    let setextLineHasPushed = false

    for (const l of lines) {
      if (/^ {0,3}(?:={3,}|-{3,})(?= {1,}|$)/.test(l) && !setextLineHasPushed) {
        setextLineHasPushed = true
      } else if (!setextLineHasPushed) {
        setextLines.push(l)
      } else {
        postParagraphLines.push(l)
      }
    }

    const newNodeState = {
      name: 'setext-heading',
      meta: {
        level,
        underline: setextHeading
      },
      text: setextLines.join('\n')
    }

    const setextHeadingBlock = ScrollPage.loadBlock(newNodeState.name).create(muya, newNodeState)

    this.parent.replaceWith(setextHeadingBlock)

    if (postParagraphLines.length) {
      const postParagraphState = {
        name: 'paragraph',
        text: postParagraphLines.join('\n')
      }
      const postParagraphBlock = ScrollPage.loadBlock(postParagraphState.name).create(muya, postParagraphState)
      setextHeadingBlock.parent.insertAfter(postParagraphBlock, setextHeadingBlock)
    }

    if (hasFocus) {
      const cursorBlock = setextHeadingBlock.children.head
      const offset = cursorBlock.text.length
      cursorBlock.setCursor(offset, offset, true)
    }
  },

  // Block Quote
  convertToBlockQuote () {
    const { text, muya, hasFocus } = this
    const { start, end } = hasFocus ? Selection.getCursorOffsets(this.domNode) : {}
    const lines = text.split('\n')
    const preParagraphLines = []
    const quoteLines = []
    let quoteLinesHasPushed = false

    for (const l of lines) {
      if (/^ {0,3}>/.test(l) && !quoteLinesHasPushed) {
        quoteLinesHasPushed = true
        quoteLines.push(l.trimStart().substring(1).trimStart())
      } else if (!quoteLinesHasPushed) {
        preParagraphLines.push(l)
      } else {
        quoteLines.push(l)
      }
    }

    let quoteParagraphState
    if (this.static.blockName === 'setextheading.content') {
      quoteParagraphState = {
        name: 'setext-heading',
        meta: this.parent.meta,
        text: quoteLines.join('\n')
      }
    } else if (this.static.blockName === 'atxheading.content') {
      quoteParagraphState = {
        name: 'atx-heading',
        meta: this.parent.meta,
        text: quoteLines.join(' ')
      }
    } else {
      quoteParagraphState = {
        name: 'paragraph',
        text: quoteLines.join('\n')
      }
    }

    const newNodeState = {
      name: 'block-quote',
      children: [quoteParagraphState]
    }

    const quoteBlock = ScrollPage.loadBlock(newNodeState.name).create(muya, newNodeState)

    this.parent.replaceWith(quoteBlock)

    if (preParagraphLines.length) {
      const preParagraphState = {
        name: 'paragraph',
        text: preParagraphLines.join('\n')
      }
      const preParagraphBlock = ScrollPage.loadBlock(preParagraphState.name).create(muya, preParagraphState)
      quoteBlock.parent.insertBefore(preParagraphBlock, quoteBlock)
    }

    if (hasFocus) {
      // TODO: USE `firstContentInDecendent`
      const cursorBlock = quoteBlock.children.head.children.head
      cursorBlock.setCursor(Math.max(0, start.offset - 1), Math.max(0, end.offset - 1), true)
    }
  },

  // Indented Code Block
  convertToIndentedCodeBlock () {
    const { text, muya, hasFocus } = this
    const lines = text.split('\n')
    const codeLines = []
    const paragraphLines = []
    let canBeCodeLine = true

    for (const l of lines) {
      if (/^ {4,}/.test(l) && canBeCodeLine) {
        codeLines.push(l.replace(/^ {4}/, ''))
      } else {
        canBeCodeLine = false
        paragraphLines.push(l)
      }
    }

    const codeState = {
      name: 'code-block',
      meta: {
        lang: '',
        type: 'indented'
      },
      text: codeLines.join('\n')
    }

    const codeBlock = ScrollPage.loadBlock(codeState.name).create(muya, codeState)
    this.parent.replaceWith(codeBlock)

    if (paragraphLines.length > 0) {
      const paragraphState = {
        name: 'paragraph',
        text: paragraphLines.join('\n')
      }
      const paragraphBlock = ScrollPage.loadBlock(paragraphState.name).create(muya, paragraphState)
      codeBlock.parent.insertAfter(paragraphBlock, codeBlock)
    }

    if (hasFocus) {
      const cursorBlock = codeBlock.lastContentInDescendant()
      cursorBlock.setCursor(0, 0)
    }
  },

  // Paragraph
  convertToParagraph (force = false) {
    if (
      !force &&
      (
        this.parent.static.blockName === 'setext-heading' ||
        this.parent.static.blockName === 'paragraph'
      )
    ) {
      return
    }

    const { text, muya, hasFocus } = this
    const { start, end } = Selection.getCursorOffsets(this.domNode)

    const newNodeState = {
      name: 'paragraph',
      text
    }

    const paragraphBlock = ScrollPage.loadBlock(newNodeState.name).create(muya, newNodeState)

    this.parent.replaceWith(paragraphBlock)

    if (hasFocus) {
      const cursorBlock = paragraphBlock.children.head
      cursorBlock.setCursor(start.offset, end.offset, true)
    }
  }
}
