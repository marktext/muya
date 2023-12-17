import { Nullable } from '@muya/types';

class LinkedNode<T> {
  public prev: Nullable<T> = null;
  public next: Nullable<T> = null;
}

export default LinkedNode;
