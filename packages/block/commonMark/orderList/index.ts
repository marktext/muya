import LinkedList from '@muya/block/base/linkedList/linkedList';
import Parent from '@muya/block/base/parent';
import ContainerQueryBlock from '@muya/block/mixins/containerQueryBlock';
import ScrollPage from '@muya/block/scrollPage';
import Muya from '@muya/index';
import { mixins } from '@muya/utils';
import { IOrderListState } from '../../../state/types';
import ListItem from '../listItem';

@mixins(ContainerQueryBlock)
class OrderList extends Parent {
  public override children: LinkedList<Parent> = new LinkedList();
  public meta: IOrderListState['meta'];

  static override blockName = 'order-list';

  static create(muya: Muya, state: IOrderListState) {
    const orderList = new OrderList(muya, state);

    orderList.append(
      ...state.children.map((child) =>
        ScrollPage.loadBlock(child.name).create(muya, child)
      )
    );

    return orderList;
  }

  override get path() {
    const { path: pPath } = this.parent!;
    const offset = this.parent!.offset(this);

    return [...pPath, offset, 'children'];
  }

  constructor(muya: Muya, { meta }: IOrderListState) {
    super(muya);
    this.tagName = 'ol';
    this.meta = meta;
    this.attributes = { start: String(meta.start) };
    this.datasets = { delimiter: meta.delimiter };
    this.classList = ['mu-order-list'];
    if (!meta.loose) {
      this.classList.push('mu-tight-list');
    }
    this.createDomNode();
  }

  override getState(): IOrderListState {
    const state: IOrderListState = {
      name: 'order-list',
      meta: { ...this.meta },
      children: this.children.map((child) => (child as ListItem).getState()),
    };

    return state;
  }
}

export default OrderList;
