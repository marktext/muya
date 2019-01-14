import backlashInToken from './backlashInToken'
import backlash from './backlash'
import highlight from './highlight'
import header from './header'
import link from './link'
import htmlTag from './htmlTag'
import hr from './hr'
import tailHeader from './tailHeader'
import hardLineBreak from './hardLineBreak'
import codeFense from './codeFense'
import inlineMath from './inlineMath'
import aLink from './aLink'
import autoLink from './autoLink'
import loadImageAsync from './loadImageAsync'
import htmlImage from './htmlImage'
import image from './image'
import delEmStrongFac from './delEmStringFactory'
import emoji from './emoji'
import inlineCode from './inlineCode'
import text from './text'
import del from './del'
import em from './em'
import strong from './strong'
import htmlEscape from './htmlEscape'
import multipleMath from './multipleMath'
import referenceDefinition from './referenceDefinition'
import referenceLink from './referenceLink'
import referenceImage from './referenceImage'
import { mixins } from '../../../utils'

const tokenRenders = {
  backlashInToken,
  backlash,
  highlight,
  header,
  link,
  htmlTag,
  hr,
  tailHeader,
  hardLineBreak,
  codeFense,
  inlineMath,
  aLink,
  autoLink,
  loadImageAsync,
  htmlImage,
  image,
  delEmStrongFac,
  emoji,
  inlineCode,
  text,
  del,
  em,
  strong,
  htmlEscape,
  multipleMath,
  referenceDefinition,
  referenceLink,
  referenceImage
}

class InlineRender {
  constructor (muya) {
    this.muya = muya
  }

  checkConflicted (block, token, cursor) {
    const { start, end } = cursor
    const key = block.key
    const { start: tokenStart, end: tokenEnd } = token.range

    if (key !== start.key && key !== end.key) {
      return false
    } else if (key === start.key && key !== end.key) {
      return conflict([tokenStart, tokenEnd], [start.offset, start.offset])
    } else if (key !== start.key && key === end.key) {
      return conflict([tokenStart, tokenEnd], [end.offset, end.offset])
    } else {
      return conflict([tokenStart, tokenEnd], [start.offset, start.offset]) ||
        conflict([tokenStart, tokenEnd], [end.offset, end.offset])
    }
  }

  getClassName (outerClass, block, token, cursor) {
    return outerClass || (this.checkConflicted(block, token, cursor) ? CLASS_OR_ID['AG_GRAY'] : CLASS_OR_ID['AG_HIDE'])
  }
}

mixins(InlineRender, tokenRenders)

export default InlineRender
