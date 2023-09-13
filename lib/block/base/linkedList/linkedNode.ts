class LinkedNode<T> {
  public prev: T | null;
  public next: T | null;

  constructor() {
    this.prev = this.next = null;
  }
}

export default LinkedNode;
