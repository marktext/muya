/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import type { Path } from 'ot-json1';
import Content from '../base/content';
import Parent from '../base/parent';

interface ContainerQueryBlock {
  find(p: number): Parent | Content;
}
class ContainerQueryBlock {
  queryBlock(path: [string, ...Path]) {
    if (/children|meta|align|type|lang/.test(path[0])) {
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
