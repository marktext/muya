import ContentBlock from '@muya/block/base/content';

export type NodeOffset = {
  offset: number;
};

// TODO: @JOCS, optimization of Cursor type, split it into for getCursor return type and setSelection params type?
export type Cursor = {
  start?: NodeOffset | null;
  end?: NodeOffset | null;
  block?: ContentBlock;
  path?: (string | number)[];
  // The same as TSelection
  anchor?: NodeOffset | null;
  focus?: NodeOffset | null;
  anchorBlock?: ContentBlock;
  anchorPath?: (string | number)[];
  focusBlock?: ContentBlock;
  focusPath?: (string | number)[];
  isCollapsed?: boolean;
  isSelectionInSameBlock?: boolean;
  direction?: string;
  type?: string;
};

// Only used for selection.getSelection return type.
export type TSelection = {
  anchor: NodeOffset;
  focus: NodeOffset;
  anchorBlock: ContentBlock;
  anchorPath: (string | number)[];
  focusBlock: ContentBlock;
  focusPath: (string | number)[];
  isCollapsed: boolean;
  isSelectionInSameBlock: boolean;
  direction: string;
  type: string;
};
