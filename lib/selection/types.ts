import ContentBlock from "@muya/block/base/content";

export type NodeOffset = {
  offset: number;
};

// TODO: @JOCS, merge Cursor and ISelection into one typescript type???
export type Cursor = {
  anchor?: NodeOffset;
  focus?: NodeOffset;
  start?: NodeOffset;
  end?: NodeOffset;
  block?: ContentBlock;
  path?: Array<string | number>;
  anchorBlock?: ContentBlock;
  anchorPath?: Array<string | number>;
  focusBlock?: ContentBlock;
  focusPath?: Array<string | number>;
  isCollapsed?: boolean;
  isSelectionInSameBlock?: boolean;
};

export type ISelection = {
  anchor: NodeOffset;
  focus: NodeOffset;
  anchorBlock: ContentBlock;
  anchorPath: Array<string | number>;
  focusBlock: ContentBlock;
  focusPath: Array<string | number>;
  isCollapsed: boolean;
  isSelectionInSameBlock: boolean;
  direction: string;
  type?: string;
};
