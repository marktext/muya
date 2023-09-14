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
    underline: "===" | "---";
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
    type: "indented" | "fenced";
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
  children: Array<TState>;
}

export interface IListItemState {
  name: "list-item";
  children: Array<TState>;
}

export interface IOrderListState {
  name: "order-list";
  meta: {
    start: number;
    loose: boolean;
    delimiter: "." | ")";
  };
  children: Array<IListItemState>;
}

export interface IBulletListState {
  name: "bullet-list";
  meta: {
    marker: "-" | "+" | "*";
    loose: boolean;
  };
  children: Array<IListItemState>;
}

export interface ITableRowState {
  name: "table.row";
  children: Array<ITableCellState>;
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
  children: Array<ITableRowState>;
}

export interface ITaskListItemMeta {
  checked: boolean;
}

export interface ITaskListItemState {
  name: "task-list-item";
  meta: ITaskListItemMeta;
  children: Array<TState>;
}

export interface ITaskListMeta {
  marker: "-" | "+" | "*";
  loose: boolean;
}

export interface ITaskListState {
  name: "task-list";
  meta: ITaskListMeta;
  children: Array<ITaskListItemState>;
}

export interface IMathMeta {
  mathStyle: "" | "gitlab";
}

export interface IMathBlockState {
  name: "math-block";
  meta: IMathMeta;
  text: string;
}

export interface IFrontmatterMeta {
  lang: "yaml" | "toml" | "json";
  style: "-" | "+" | ";;;" | "{}";
}

export interface IFrontmatterState {
  name: "frontmatter";
  meta: IFrontmatterMeta;
  text: string;
}

export interface IDiagramMeta {
  lang: "yaml";
  type: "flowchart" | "sequence" | "mermaid" | "plantuml" | "vega-lite";
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
  blankReplacement: (content: unknown, node: any, options: unknown) => string;
}
