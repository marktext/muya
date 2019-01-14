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
  checkConflicted (block, token, cursor) {
    const { anchor, focus } = cursor
    const { start, end } = token.range

    if (block !== anchor.block && block !== focus.block) {
      return false
    } else if (block === anchor.block && block !== focus.block) {
      return conflict([start, end], [anchor.offset, anchor.offset])
    } else if (block !== anchor.block && block === focus.block) {
      return conflict([start, end], [focus.offset, focus.offset])
    } else {
      return conflict([start, end], [anchor.offset, anchor.offset]) ||
        conflict([start, end], [foucs.offset, focus.offset])
    }
  }

  getClassName (outerClass, block, token, cursor) {
    return outerClass || (this.checkConflicted(block, token, cursor) ? 'mu-gray' : 'mu-hide')
  }
}

mixins(InlineRender, tokenRenders)

export default InlineRender
