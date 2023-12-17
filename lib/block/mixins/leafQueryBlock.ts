import type { Path } from 'ot-json1';

class LeafQueryBlock {
  public firstChild: unknown;

  queryBlock(path: Path) {
    return path.length && path[0] === 'text' ? this.firstChild : this;
  }
}

export default LeafQueryBlock;
