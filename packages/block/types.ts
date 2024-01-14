import Muya from '@muya/index';

export interface IConstructor<T> {
  blockName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create: (muya: Muya, state: any) => T;
  new (muya: Muya): T;
}

export type TBlockPath = (string | number)[];