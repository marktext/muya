import Content from './content'

class ParagraphContent extends Content {
  static blockName = 'paragraph.content'

  static create (muya, parent, state) {
    const content = new ParagraphContent(muya, parent, state)

    content.createDomNodeAndMount()

    return content
  }

  constructor (muya, parent, state) {
    super(muya, parent, state)

    this.classList = [...this.classList, 'mu-paragraph-content']
  }
}

export default ParagraphContent
