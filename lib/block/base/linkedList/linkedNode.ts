class LinkedNode {
  public prev: LinkedNode | null;
  public next: LinkedNode | null;

  constructor() {
    this.prev = this.next = null;
  }
}

export default LinkedNode;
