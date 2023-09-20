export interface MuyaOptions {
  fontSize: number;
  lineHeight: number;
  focusMode: boolean;
  markdown: string;
  trimUnnecessaryCodeBlockEmptyLines: boolean;
  preferLooseListItem: boolean;
  autoPairBracket: boolean;
  autoPairMarkdownSyntax: boolean;
  autoPairQuote: boolean;
  bulletListMarker: string;
  orderListDelimiter: string;
  tabSize: number;
  codeBlockLineNumbers: boolean;
  listIndentation: number;
  frontMatter: boolean;
  frontmatterType: string;
  sequenceTheme: string;
  mermaidTheme: string;
  vegaTheme: string;
  hideQuickInsertHint: boolean;
  hideLinkPopup: boolean;
  autoCheck: boolean;
  spellcheckEnabled: boolean;
  superSubScript: boolean;
  footnote: boolean;
  isGitlabCompatibilityEnabled: boolean;
  autoMoveCheckedToEnd: boolean;
  disableHtml: boolean;
  locale: {
    name: string;
    resource: {
      [key: string]: string;
    }
  },
  imageAction: (...args: Array<any>) => Promise<string>;
  imagePathPicker: () => Promise<string>;
  clipboardFilePath: () => any;
  imagePathAutoComplete: (value: string) => Array<string>;
}
