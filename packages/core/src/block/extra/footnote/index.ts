import type { Muya } from '../../../muya';
import type { IFootnoteBlockMeta, IFootnoteBlockState } from '../../../state/types';
import { CLASS_NAMES } from '../../../config';
import { mixins } from '../../../utils';
import Parent from '../../base/parent';
import IContainerQueryBlock from '../../mixins/containerQueryBlock';
import { ScrollPage } from '../../scrollPage';

@mixins(IContainerQueryBlock)
class Footnote extends Parent {
    public meta: IFootnoteBlockMeta;

    static override blockName = 'footnote';

    static create(muya: Muya, state: IFootnoteBlockState) {
        const footnote = new Footnote(muya, state);

        for (const child of state.children)
            footnote.append(ScrollPage.loadBlock(child.name).create(muya, child));

        return footnote;
    }

    // Container-block path semantics: descendants address into `children`
    // (mirrors BlockQuote / list-item). `Parent.getJsonPath` strips the
    // trailing 'children' segment via `isContainerBlock`, which we override
    // below so footnote participates in the same json1 op routing.
    override get path() {
        const { path: pPath } = this.parent!;
        const offset = this.parent!.offset(this);

        return [...pPath, offset, 'children'];
    }

    override get isContainerBlock() {
        return true;
    }

    constructor(muya: Muya, { meta }: IFootnoteBlockState) {
        super(muya);
        this.tagName = 'figure';
        this.meta = { identifier: meta.identifier };
        this.classList = [CLASS_NAMES.MU_FOOTNOTE];
        this.createDomNode();
    }

    override getState(): IFootnoteBlockState {
        return {
            name: 'footnote',
            meta: { identifier: this.meta.identifier },
            children: this.children.map(child => (child as Parent).getState()),
        };
    }
}

export default Footnote;
