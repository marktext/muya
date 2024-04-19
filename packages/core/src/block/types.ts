import type { Muya } from '../muya';

export interface IConstructor<T> {
    blockName: string;
    create: (muya: Muya, state: any) => T;
    new (muya: Muya): T;
}

export type TBlockPath = (string | number)[];
