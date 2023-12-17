import Format from '@muya/block/base/format';
import ScrollPage from '@muya/block/scrollPage';
import Muya from '@muya/index';
import { Cursor } from '@muya/selection/types';

class ThematicBreakContent extends Format {
  static blockName = 'thematicbreak.content';

  static create(muya: Muya, text: string) {
    const content = new ThematicBreakContent(muya, text);

    return content;
  }

  constructor(muya: Muya, text: string) {
    super(muya, text);
    this.classList = [...this.classList, 'mu-thematic-break-content'];
    this.createDomNode();
  }

  getAnchor() {
    return this.parent;
  }

  update(cursor: Cursor, highlights = []) {
    return this.inlineRenderer.patch(this, cursor, highlights);
  }

  /**
   * Create an empty paragraph bellow.
   * @param {*} event
   */
  enterHandler(event: Event) {
    const { text, muya } = this;
    const { start, end } = this.getCursor()!;
    if (start.offset === end.offset && start.offset === 0) {
      const newState = {
        name: 'paragraph',
        text: '',
      };
      const emptyParagraph = ScrollPage.loadBlock(newState.name).create(
        muya,
        newState
      );
      const thematicBreak = this.parent;
      thematicBreak!.parent!.insertBefore(emptyParagraph, thematicBreak);
    } else {
      const offset = text.length;
      this.setCursor(offset, offset);
      super.enterHandler(event as KeyboardEvent);
    }
  }

  backspaceHandler(event: Event) {
    const { start, end } = this.getCursor()!;
    if (start.offset === 0 && end.offset === 0) {
      // Remove the text content and convert it to paragraph
      this.text = '';
      this.convertToParagraph();
    } else {
      super.backspaceHandler(event);
    }
  }
}

export default ThematicBreakContent;
