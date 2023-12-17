import Content from '@muya/block/base/content';

export interface ISearchOption {
  isCaseSensitive?: boolean;
  isWholeWord?: boolean;
  isRegexp?: boolean;
  selectHighlight?: boolean;
  highlightIndex?: number;
}

export interface IMatch {
  start: number;
  end: number;
  block: Content;
  match: string;
  subMatches: string[];
}
