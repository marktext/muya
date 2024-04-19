import ScrollPage from '../..';
import Format from '../../base/format';
import type AtxHeading from '../../commonMark/atxHeading';
import type { Muya } from '../../../muya';
import type { ICursor } from '../../../selection/types';

class AtxHeadingContent extends Format {
    public override parent: AtxHeading | null = null;

    static override blockName = 'atxheading.content';

    static create(muya: Muya, text: string) {
        const content = new AtxHeadingContent(muya, text);

        return content;
    }

    constructor(muya: Muya, text: string) {
        super(muya, text);
        this.classList = [...this.classList, 'mu-atxheading-content'];
        this.createDomNode();
    }

    override getAnchor() {
        return this.parent;
    }

    override update(cursor: ICursor, highlights = []) {
        return this.inlineRenderer.patch(this, cursor, highlights);
    }

    override enterHandler(event: Event) {
        const { start, end } = this.getCursor()!;
        const { level } = this.parent!.meta;

        if (start.offset === end.offset && start.offset <= level + 1) {
            const newNodeState = {
                name: 'paragraph',
                text: '',
            };

            const newParagraphBlock = ScrollPage.loadBlock(newNodeState.name).create(
                this.muya,
                newNodeState,
            );
            this.parent!.parent!.insertBefore(newParagraphBlock, this.parent);
            this.setCursor(start.offset, end.offset, true);
        }
        else {
            super.enterHandler(event as KeyboardEvent);
        }
    }

    override backspaceHandler(event: Event) {
        const { start, end } = this.getCursor()!;
        if (start.offset === 0 && end.offset === 0) {
            event.preventDefault();
            this.text = this.text.replace(/^ {0,3}#{1,6} */, '');
            this.convertToParagraph();
        }
        else if (start.offset === 1 && end.offset === 1 && this.text === '#') {
            event.preventDefault();
            this.text = '';
            this.setCursor(0, 0);
            this.convertToParagraph();
        }
        else {
            super.backspaceHandler(event);
        }
    }
}

export default AtxHeadingContent;
