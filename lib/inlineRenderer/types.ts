import type Format from "@muya/block/base/format";
import type { Cursor } from "@muya/selection/types";
import { h } from "snabbdom";

export type H = typeof h;

export type SyntaxRenderOptions = {
  h: H;
  cursor: Cursor;
  block: Format;
  token: Token;
  outerClass?: string;
};

export type Highlight = {
  start: number;
  end: number;
  active: boolean | undefined;
};

export type Labels = Map<
  string,
  {
    href: string;
    title: string;
  }
>;

export type Rules = Record<string, RegExp>;

export type TokenizerFacOptions = {
  superSubScript: boolean;
  footnote: boolean;
};

export type TokenizerOptions = {
  highlights?: Highlight[];
  hasBeginRules?: boolean;
  labels?: Labels;
  options?: TokenizerFacOptions;
};

export type TokenRange = {
  start: number;
  end: number;
};

export type Token =
  | BeginRuleToken
  | ReferenceDefinitionToken
  | TextToken
  | BacklashToken
  | StrongEmToken
  | CodeEmojiMathToken
  | DelToken
  | SuperSubScriptToken
  | FootnoteIdentifierToken
  | ImageToken
  | LinkToken
  | ReferenceLinkToken
  | ReferenceImageToken
  | HTMLEscapeToken
  | AutoLinkExtensionToken
  | AutoLinkToken
  | HTMLTagToken
  | SoftLineBreakToken
  | HardLineBreakToken
  | TailHeaderToken;

export type BaseToken = {
  raw: string;
  parent: Token[];
  range: TokenRange;
  highlights?: Highlight[];
};

export type BeginRuleToken = BaseToken & {
  type: "header" | "hr" | "code_fence" | "multiple_math";
  marker: string;
  content: string;
  backlash: string;
};

export type ReferenceDefinitionToken = BaseToken & {
  type: "reference_definition";
  leftBracket: string;
  label: string;
  backlash: string;
  rightBracket: string;
  leftHrefMarker: string;
  href: string;
  rightHrefMarker: string;
  leftTitleSpace: string;
  titleMarker: string;
  title: string;
  rightTitleSpace: string;
};

export type TextToken = BaseToken & {
  type: "text";
  content: string;
};

export type BacklashToken = BaseToken & {
  type: "backlash";
  marker: string;
  content: string;
};

export type StrongEmToken = BaseToken & {
  type: "strong" | "em";
  marker: string;
  children: Token[];
  backlash: string;
};

export type CodeEmojiMathToken = BaseToken & {
  type: "inline_code" | "emoji" | "inline_math";
  marker: string;
  content: string;
  backlash: string;
};

export type DelToken = BaseToken & {
  type: "del";
  marker: string;
  children: Token[];
  backlash: string;
};

export type SuperSubScriptToken = BaseToken & {
  type: "super_sub_script";
  marker: string;
  content: string;
};

export type FootnoteIdentifierToken = BaseToken & {
  type: "footnote_identifier";
  marker: string;
  content: string;
};

export type ImageToken = BaseToken & {
  type: "image";
  marker: string;
  srcAndTitle: string;
  attrs: {
    src: string;
    title: string;
    alt: string;
    [key: string]: string;
  };
  src: string;
  title: string;
  alt: string;
  backlash: {
    first: string;
    second: string;
  };
};

export type LinkToken = BaseToken & {
  type: "link";
  marker: string;
  hrefAndTitle: string;
  href: string;
  title: string;
  anchor: string;
  children: Token[];
  backlash: {
    first: string;
    second: string;
  };
};

export type ReferenceLinkToken = BaseToken & {
  type: "reference_link";
  isFullLink: boolean;
  anchor: string;
  backlash: {
    first: string;
    second: string;
  };
  label: string;
  children: Token[];
};

export type ReferenceImageToken = BaseToken & {
  type: "reference_image";
  isFullLink: boolean;
  alt: string;
  backlash: {
    first: string;
    second: string;
  };
  label: string;
};

export type HTMLEscapeToken = BaseToken & {
  type: "html_escape";
  escapeCharacter: string;
};

export type AutoLinkExtensionToken = BaseToken & {
  type: "auto_link_extension";
  www: string;
  url: string;
  email: string;
  linkType: "www" | "url" | "email";
};

export type AutoLinkToken = BaseToken & {
  type: "auto_link";
  href: string;
  email: string;
  isLink: boolean; // It is a link or email.
  marker: "<";
};

export type HTMLTagToken = BaseToken & {
  type: "html_tag";
  tag: string;
  openTag: string;
  attrs: Record<string, string | null>;
  closeTag?: string;
  content?: string;
  children?: Token[] | "";
};

export type SoftLineBreakToken = BaseToken & {
  type: "soft_line_break";
  lineBreak: string;
  isAtEnd: boolean;
};

export type HardLineBreakToken = BaseToken & {
  type: "hard_line_break";
  spaces: string; // The space in hard line break
  lineBreak: string; // \n
  isAtEnd: boolean;
};

export type TailHeaderToken = BaseToken & {
  type: "tail_header";
  marker: string;
};
