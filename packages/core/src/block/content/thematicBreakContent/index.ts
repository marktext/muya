import Format from '../../base/format';
import ScrollPage from '../../scrollPage';
import type { Muya } from '../../../muya';
import type { ICursor } from '../../../selection/types';

class ThematicBreakContent extends Format {
    static override blockName = 'thematicbreak.content';

    static create(muya: Muya, text: string) {
        const content = new ThematicBreakContent(muya, text);

        return content;
    }

    constructor(muya: Muya, text: string) {
        super(muya, text);
        this.classList = [...this.classList, 'mu-thematic-break-content'];
        this.createDomNode();
    }

    override getAnchor() {
        return this.parent;
    }

    override update(cursor: ICursor, highlights = []) {
        return this.inlineRenderer.patch(this, cursor, highlights);
    }

    /**
     * Create an empty paragraph bellow.
     * @param {*} event
     */
    override enterHandler(event: Event) {
        const { text, muya } = this;
        const { start, end } = this.getCursor()!;
        if (start.offset === end.offset && start.offset === 0) {
            const newState = {
                name: 'paragraph',
                text: '',
            };
            const emptyParagraph = ScrollPage.loadBlock(newState.name).create(
                muya,
                newState,
            );
            const thematicBreak = this.parent;
            thematicBreak!.parent!.insertBefore(emptyParagraph, thematicBreak);
        }
        else {
            const offset = text.length;
            this.setCursor(offset, offset);
            super.enterHandler(event as KeyboardEvent);
        }
    }

    override backspaceHandler(event: Event) {
        const { start, end } = this.getCursor()!;
        if (start.offset === 0 && end.offset === 0) {
            // Remove the text content and convert it to paragraph
            this.text = '';
            this.convertToParagraph();
        }
        else {
            super.backspaceHandler(event);
        }
    }
}

export default ThematicBreakContent;
