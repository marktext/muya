import Parent from '../../base/parent';
import type ParagraphContent from '../../content/paragraphContent';
import LeafQueryBlock from '../../mixins/leafQueryBlock';
import { ScrollPage } from '../../scrollPage';
import type { Muya } from '../../../muya';
import { mixins } from '../../../utils';
import type { IParagraphState } from '../../../state/types';

@mixins(LeafQueryBlock)
class Paragraph extends Parent {
    static override blockName = 'paragraph';

    static create(muya: Muya, state: IParagraphState) {
        const paragraph = new Paragraph(muya);

        paragraph.append(
            ScrollPage.loadBlock('paragraph.content').create(muya, state.text),
        );

        return paragraph;
    }

    override get path() {
        const { path: pPath } = this.parent!;
        const offset = this.parent!.offset(this);

        return [...pPath, offset];
    }

    constructor(muya: Muya) {
        super(muya);
        this.tagName = 'p';
        this.classList = ['mu-paragraph'];
        this.createDomNode();
    }

    override getState(): IParagraphState {
        return {
            name: 'paragraph',
            text: (this.children.head as ParagraphContent).text,
        };
    }
}

export default Paragraph;
