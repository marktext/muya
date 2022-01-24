import backlashInToken from './backlashInToken'
import backlash from './backlash'
import highlight from './highlight'
import header from './header'
import link from './link'
import htmlTag from './htmlTag'
import hr from './hr'
import tailHeader from './tailHeader'
import hardLineBreak from './hardLineBreak'
import softLineBreak from './softLineBreak'
import codeFense from './codeFense'
import inlineMath from './inlineMath'
import autoLink from './autoLink'
import autoLinkExtension from './autoLinkExtension'
import loadImageAsync from './loadImageAsync'
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
import htmlRuby from './htmlRuby'
import referenceLink from './referenceLink'
import referenceImage from './referenceImage'
import superSubScript from './superSubScript'
import footnoteIdentifier from './footnoteIdentifier'
import { CLASS_NAMES } from '@/config'
import { mixins, conflict, snakeToCamel } from '@/utils'
import { h, toHTML } from '@/utils/snabbdom'

const inlineSyntaxRenderer = {
  backlashInToken,
  backlash,
  highlight,
  header,
  link,
  htmlTag,
  hr,
  tailHeader,
  hardLineBreak,
  softLineBreak,
  codeFense,
  inlineMath,
  autoLink,
  autoLinkExtension,
  loadImageAsync,
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
  htmlRuby,
  referenceLink,
  referenceImage,
  superSubScript,
  footnoteIdentifier
}

class Renderer {
  constructor (muya, parent) {
    this.muya = muya
    this.parent = parent
    this.loadMathMap = new Map()
    this.loadImageMap = new Map()
    this.urlMap = new Map()
  }

  checkConflicted (block, token, cursor = {}) {
    // cursor start.block === end.block, so we only need to check start
    const anchor = cursor.anchor || cursor.start
    const focus = cursor.focus || cursor.end
    if (!anchor || (anchor.block && anchor.block !== block)) {
      return false
    }

    const { start, end } = token.range

    return conflict([start, end], [anchor.offset, anchor.offset]) || conflict([start, end], [focus.offset, focus.offset])
  }

  getClassName (outerClass, block, token, cursor) {
    return outerClass || (this.checkConflicted(block, token, cursor) ? CLASS_NAMES.MU_GRAY : CLASS_NAMES.MU_HIDE)
  }

  getHighlightClassName (active) {
    return active ? CLASS_NAMES.MU_HIGHLIGHT : CLASS_NAMES.MU_SELECTION
  }

  output (tokens, block, cursor) {
    const children = tokens.reduce((acc, token) => [...acc, ...this[snakeToCamel(token.type)](h, cursor, block, token)], [])
    const vNode = h('span', children)
    const rawHtml = toHTML(vNode)

    return rawHtml.replace(/^<span>([\s\S]*)<\/span>$/g, (_, p) => p)
  }
}

mixins(Renderer, inlineSyntaxRenderer)

export default Renderer
