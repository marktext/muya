import ContentBlock from "@muya/block/base/content";

export type NodeOffset = {
  offset: number;
};

// TODO: @JOCS, merge Cursor and TSelection into one typescript type???
export type Cursor = {
  anchor?: NodeOffset | null;
  focus?: NodeOffset | null;
  start?: NodeOffset | null;
  end?: NodeOffset | null;
  block?: ContentBlock;
  path?: (string | number)[];
  anchorBlock?: ContentBlock;
  anchorPath?: (string | number)[];
  focusBlock?: ContentBlock;
  focusPath?: (string | number)[];
  isCollapsed?: boolean;
  isSelectionInSameBlock?: boolean;
};

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
  type?: string;
};
