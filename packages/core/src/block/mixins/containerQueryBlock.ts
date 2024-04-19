/* eslint-disable ts/no-unsafe-declaration-merging */
import type Content from '../base/content';
import type Parent from '../base/parent';
import type { TBlockPath } from '../types';

interface IContainerQueryBlock {
    find: (p: number) => Parent | Content;
}
class IContainerQueryBlock {
    queryBlock(path: TBlockPath) {
        if (typeof path[0] === 'string' && /children|meta|align|type|lang/.test(path[0]))
            path.shift();

        if (path.length === 0)
            return this;

        const p = path.shift() as number;
        const block = this.find(p);

        return block && path.length ? (block as any).queryBlock(path) : block;
    }
}

export default IContainerQueryBlock;
