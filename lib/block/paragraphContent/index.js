import Content from '@/block/base/content'
import { EVENT_KEYS } from '@/config'
import './index.css'

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

  inputHandler (event) {
    console.log(event)
  }

  keydownHandler = (event) => {
    switch (event.key) {
      case EVENT_KEYS.Backspace:
        this.backspaceHandler(event)
        break

      case EVENT_KEYS.Delete:
        this.deleteHandler(event)
        break

      case EVENT_KEYS.Enter:
        if (!this.isComposed) {
          this.enterHandler(event)
        }
        break

      case EVENT_KEYS.ArrowUp: // fallthrough

      case EVENT_KEYS.ArrowDown: // fallthrough

      case EVENT_KEYS.ArrowLeft: // fallthrough

      case EVENT_KEYS.ArrowRight: // fallthrough
        if (!this.isComposed) {
          this.arrowHandler(event)
        }
        break

      case EVENT_KEYS.Tab:
        this.tabHandler(event)
        break
      default:
        break
    }
  }

  backspaceHandler (event) {
    console.log('backspace')
  }

  deleteHandler (event) {
    console.log('delete')
  }

  enterHandler (event) {
    event.preventDefault()
    console.log(this.hasFocus)
  }

  arrowHandler (event) {
    console.log('arrow')
  }

  tabHandler (event) {
    console.log('tab')
  }
}

export default ParagraphContent
