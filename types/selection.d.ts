import ContentBlock from "@/block/base/content";

export interface NodeOffset {
  offset: number;
}

export interface ICursor {
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
}

export interface ISelection {
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
}
