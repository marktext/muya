import Parent from '@muya/block/base/parent';
import ContainerQueryBlock from '@muya/block/mixins/containerQueryBlock';
import ScrollPage from '@muya/block/scrollPage';
import Muya from '@muya/index';
import { mixins } from '@muya/utils';
import { ITableState } from '../../../state/types';
import TableRow from './row';

@mixins(ContainerQueryBlock)
class TableInner extends Parent {
  static blockName = 'table.inner';

  static create(muya: Muya, state: ITableState) {
    const table = new TableInner(muya, state);

    table.append(
      ...state.children.map((child) =>
        ScrollPage.loadBlock('table.row').create(muya, child)
      )
    );

    return table;
  }

  get path() {
    return [...this.parent!.path, 'children'];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(muya: Muya, _state: ITableState) {
    super(muya);
    this.tagName = 'table';

    this.classList = ['mu-table-inner'];
    this.createDomNode();
  }

  getState(): ITableState {
    const state: ITableState = {
      name: 'table',
      children: this.map((node) => (node as TableRow).getState()),
    };

    return state;
  }
}

export default TableInner;
