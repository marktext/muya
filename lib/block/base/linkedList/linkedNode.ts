import { Nullable } from "@muya/types";

class LinkedNode<T> {
  public prev: Nullable<T>;
  public next: Nullable<T>;

  constructor() {
    this.prev = this.next = null;
  }
}

export default LinkedNode;
