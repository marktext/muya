/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import Content from '../base/content';
import Parent from '../base/parent';
import { TBlockPath } from '../types';

interface ContainerQueryBlock {
  find(p: number): Parent | Content;
}
class ContainerQueryBlock {
  queryBlock(path: TBlockPath) {
    if (typeof path[0] === 'string' && /children|meta|align|type|lang/.test(path[0])) {
      path.shift();
    }

    if (path.length === 0) {
      return this;
    }

    const p = path.shift() as number;
    const block = this.find(p);

    return block && path.length ? (block as any).queryBlock(path) : block;
  }
}

export default ContainerQueryBlock;
