import { Nullable } from '@muya/types';

export interface LinkedNode {
  prev: Nullable<LinkedNode>;

  next: Nullable<LinkedNode>;
}
