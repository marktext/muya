import LinkedList from '@muya/block/base/linkedList/linkedList';
import Parent from '@muya/block/base/parent';
import ContainerQueryBlock from '@muya/block/mixins/containerQueryBlock';
import ScrollPage from '@muya/block/scrollPage';
import Muya from '@muya/index';
import { mixins } from '@muya/utils';
import { ITableRowState } from '../../../state/types';
import TableBodyCell from './cell';

@mixins(ContainerQueryBlock)
class TableRow extends Parent {
  override children: LinkedList<TableBodyCell> = new LinkedList();

  static override blockName = 'table.row';

  static create(muya: Muya, state: ITableRowState) {
    const row = new TableRow(muya);

    row.append(
      ...state.children.map((child) =>
        ScrollPage.loadBlock('table.cell').create(muya, child)
      )
    );

    return row;
  }

  override get path() {
    const { path: pPath } = this.parent!;
    const offset = this.parent!.offset(this);

    return [...pPath, offset];
  }

  constructor(muya: Muya) {
    super(muya);
    this.tagName = 'tr';

    this.classList = ['mu-table-row'];
    this.createDomNode();
  }

  override getState(): ITableRowState {
    const state: ITableRowState = {
      name: 'table.row',
      children: this.map((node) => (node as TableBodyCell).getState()),
    };

    return state;
  }
}

export default TableRow;
