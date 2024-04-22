import type Content from '../../base/content';
import Parent from '../../base/parent';
import LeafQueryBlock from '../../mixins/leafQueryBlock';
import { ScrollPage } from '../../scrollPage';
import type { TBlockPath } from '../../types';
import { mixins } from '../../../utils';
import type { IAtxHeadingState } from '../../../state/types';
import type { Muya } from '../../../muya';

@mixins(LeafQueryBlock)
class AtxHeading extends Parent {
    public meta: IAtxHeadingState['meta'];

    static override blockName = 'atx-heading';

    static create(muya: Muya, state: IAtxHeadingState) {
        const heading = new AtxHeading(muya, state);

        heading.append(
            ScrollPage.loadBlock('atxheading.content').create(muya, state.text),
        );

        return heading;
    }

    override get path(): TBlockPath {
        const { path: pPath } = this.parent!;
        const offset = this.parent!.offset(this);

        return [...pPath, offset];
    }

    constructor(muya: Muya, { meta }: IAtxHeadingState) {
        super(muya);
        this.tagName = `h${meta.level}`;
        this.meta = meta;
        this.classList = ['mu-atx-heading'];
        this.createDomNode();
    }

    override getState(): IAtxHeadingState {
        return {
            name: 'atx-heading',
            meta: this.meta,
            text: (this.children.head as Content).text,
        };
    }
}

export default AtxHeading;
