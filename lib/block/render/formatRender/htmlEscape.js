import escapeCharactersMap from '../../../config/escapeCharacter'

export default function htmlEscape (h, cursor, block, token, outerClass) {
  const className = this.getClassName(outerClass, block, token, cursor)
  const { escapeCharacter } = token
  const { start, end } = token.range

  const content = this.highlight(h, block, start, end, token)

  return [
    h(`span.${className}.mu-html-escape`, {
      dataset: {
        character: escapeCharactersMap[escapeCharacter]
      }
    }, content)
  ]
}
