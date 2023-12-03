export interface IParagraphState {
  name: "paragraph";
  text: string;
}

export interface IAtxHeadingState {
  name: "atx-heading";
  meta: {
    level: number;
  };
  text: string;
}

export interface ISetextHeadingState {
  name: "setext-heading";
  meta: {
    level: number;
    underline: string; // "===" | "---";
  };
  text: string;
}

export interface IThematicBreakState {
  name: "thematic-break";
  text: string;
}

export interface ICodeBlockState {
  name: "code-block";
  meta: {
    type: string; // "indented" | "fenced";
    lang: string;
  };
  text: string;
}

export interface IHtmlBlockState {
  name: "html-block";
  text: string;
}

export interface ILinkReferenceDefinitionState {
  name: "link-reference-definition";
  text: string;
}

export interface IBlockQuoteState {
  name: "block-quote";
  children: TState[];
}

export interface IListItemState {
  name: "list-item";
  children: TState[];
}

export interface IOrderListState {
  name: "order-list";
  meta: {
    start: number;
    loose: boolean;
    delimiter: string; // "." | ")";
  };
  children: IListItemState[];
}

export interface IBulletListState {
  name: "bullet-list";
  meta: {
    marker: string; // "-" | "+" | "*";
    loose: boolean;
  };
  children: IListItemState[];
}

export interface ITableRowState {
  name: "table.row";
  children: ITableCellState[];
}

export interface ITableCellMeta {
  align: "none" | "left" | "center" | "right";
}

export interface ITableCellState {
  name: "table.cell";
  meta: ITableCellMeta;
  text: string;
}

export interface ITableState {
  name: "table";
  children: ITableRowState[];
}

export interface ITaskListItemMeta {
  checked: boolean;
}

export interface ITaskListItemState {
  name: "task-list-item";
  meta: ITaskListItemMeta;
  children: TState[];
}

export interface ITaskListMeta {
  marker: string; // "-" | "+" | "*";
  loose: boolean;
}

export interface ITaskListState {
  name: "task-list";
  meta: ITaskListMeta;
  children: ITaskListItemState[];
}

export interface IMathMeta {
  mathStyle: string; // "" | "gitlab";
}

export interface IMathBlockState {
  name: "math-block";
  meta: IMathMeta;
  text: string;
}

export interface IFrontmatterMeta {
  lang: string; // "yaml" | "toml" | "json";
  style: string; //  "-" | "+" | ";" | "{";
}

export interface IFrontmatterState {
  name: "frontmatter";
  meta: IFrontmatterMeta;
  text: string;
}

export interface IDiagramMeta {
  lang: "yaml";
  type: "mermaid" | "plantuml" | "vega-lite";
}

export interface IDiagramState {
  name: "diagram";
  meta: IDiagramMeta;
  text: string;
}

export type TLeafState =
  | IParagraphState
  | IAtxHeadingState
  | ISetextHeadingState
  | IThematicBreakState
  | ICodeBlockState
  | IHtmlBlockState
  | ILinkReferenceDefinitionState
  | IMathBlockState
  | IFrontmatterState
  | IDiagramState
  | ITableCellState;

export type TContainerState =
  | IBlockQuoteState
  | IOrderListState
  | IBulletListState
  | ITableState
  | ITaskListState
  | ITaskListItemState
  | IListItemState
  | ITableRowState;

export type TState = TLeafState | TContainerState;

export type CodeContentState = ICodeBlockState | IHtmlBlockState | IDiagramState | IMathBlockState | IFrontmatterState

export interface ITurnoverOptions {
  headingStyle: "atx" | "setext"; // setext or atx
  hr: "---";
  bulletListMarker: "-" | "+" | "*"; // -, +, or *
  codeBlockStyle: "fenced" | "indented"; // fenced or indented
  fence: "```" | "~~~"; // ``` or ~~~
  emDelimiter: "*" | "_"; // _ or *
  strongDelimiter: "**" | "__"; // ** or __
  linkStyle: "inlined";
  linkReferenceStyle: "full";
  blankReplacement: (content: unknown, node: unknown, options: unknown) => string;
}
