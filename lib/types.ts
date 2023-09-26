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
  frontmatterType: "-" | "+" | ";" | "{}";
  sequenceTheme: string;
  mermaidTheme: string;
  vegaTheme: string;
  hideQuickInsertHint: boolean;
  hideLinkPopup: boolean;
  autoCheck: boolean;
  spellcheckEnabled: boolean;
  superSubScript: boolean;
  footnote: boolean;
  math: boolean;
  isGitlabCompatibilityEnabled: boolean;
  autoMoveCheckedToEnd: boolean;
  disableHtml: boolean;
  locale: {
    name: string;
    resource: {
      [key: string]: string;
    }
  },
}
