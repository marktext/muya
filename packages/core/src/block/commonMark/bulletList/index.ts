import { LinkedList } from '../../base/linkedList/linkedList';
import Parent from '../../base/parent';
import IContainerQueryBlock from '../../mixins/containerQueryBlock';
import { ScrollPage } from '../../scrollPage';
import type { Muya } from '../../../muya';
import type { IBulletListState, IListItemState } from '../../../state/types';
import { mixins } from '../../../utils';

@mixins(IContainerQueryBlock)
class BulletList extends Parent {
    public override children: LinkedList<Parent> = new LinkedList();

    static override blockName = 'bullet-list';

    static create(muya: Muya, state: IBulletListState) {
        const bulletList = new BulletList(muya, state);

        bulletList.append(
            ...state.children.map(child =>
                ScrollPage.loadBlock(child.name).create(muya, child),
            ),
        );

        return bulletList;
    }

    override get path() {
        const { path: pPath } = this.parent!;
        const offset = this.parent!.offset(this);

        return [...pPath, offset, 'children'];
    }

    public meta: IBulletListState['meta'];

    constructor(muya: Muya, { meta }: IBulletListState) {
        super(muya);
        this.tagName = 'ul';
        this.meta = meta;
        this.datasets = {
            marker: meta.marker,
        };
        this.classList = ['mu-bullet-list'];
        if (!meta.loose)
            this.classList.push('mu-tight-list');

        this.createDomNode();
    }

    override getState(): IBulletListState {
        const state: IBulletListState = {
            name: 'bullet-list',
            meta: { ...this.meta },
            children: this.children.map(child =>
                (child as Parent).getState(),
            ) as IListItemState[],
        };

        return state;
    }
}

export default BulletList;
