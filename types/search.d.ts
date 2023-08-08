export interface ISearchOption {
  isCaseSensitive: boolean;
  isWholeWord: boolean;
  isRegexp: boolean;
  selectHighlight: boolean;
  highlightIndex: number;
}