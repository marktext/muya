import backlashInToken from "./backlashInToken";
import backlash from "./backlash";
import highlight from "./highlight";
import header from "./header";
import link from "./link";
import htmlTag from "./htmlTag";
import hr from "./hr";
import tailHeader from "./tailHeader";
import hardLineBreak from "./hardLineBreak";
import softLineBreak from "./softLineBreak";
import codeFence from "./codeFence";
import inlineMath from "./inlineMath";
import autoLink from "./autoLink";
import autoLinkExtension from "./autoLinkExtension";
import loadImageAsync from "./loadImageAsync";
import image from "./image";
import delEmStrongFac from "./delEmStrongFactory";
import emoji from "./emoji";
import inlineCode from "./inlineCode";
import text from "./text";
import del from "./del";
import em from "./em";
import strong from "./strong";
import htmlEscape from "./htmlEscape";
import multipleMath from "./multipleMath";
import referenceDefinition from "./referenceDefinition";
import htmlRuby from "./htmlRuby";
import referenceLink from "./referenceLink";
import referenceImage from "./referenceImage";
import superSubScript from "./superSubScript";
import footnoteIdentifier from "./footnoteIdentifier";
import { CLASS_NAMES } from "@muya/config";
import { methodMixins, conflict, snakeToCamel } from "@muya/utils";
import { h, toHTML } from "@muya/utils/snabbdom";
import type Muya from "@muya/index";
import type Format from "@muya/block/base/format";
import type InlineRenderer from "../index";
import type { VNode } from "snabbdom";
import type { Token } from "../types";
import type { Cursor } from "@muya/selection/types";

const inlineSyntaxRenderer = {
  backlashInToken,
  backlash,
  highlight,
  header,
  link,
  htmlTag,
  hr,
  tailHeader,
  hardLineBreak,
  softLineBreak,
  codeFence,
  inlineMath,
  autoLink,
  autoLinkExtension,
  loadImageAsync,
  image,
  delEmStrongFac,
  emoji,
  inlineCode,
  text,
  del,
  em,
  strong,
  htmlEscape,
  multipleMath,
  referenceDefinition,
  htmlRuby,
  referenceLink,
  referenceImage,
  superSubScript,
  footnoteIdentifier,
};

type InlineSyntaxRender = typeof inlineSyntaxRenderer;

interface Renderer extends InlineSyntaxRender {}

@methodMixins(inlineSyntaxRenderer)
class Renderer {
  public loadMathMap: Map<
    string,
    string | VNode | (string | VNode)[] | undefined
  > = new Map();
  public loadImageMap: Map<
    string,
    {
      id: string;
      isSuccess: boolean;
      width?: number;
      height?: number;
    }
  > = new Map();
  public urlMap: Map<string, string> = new Map();

  constructor(public muya: Muya, public parent: InlineRenderer) {}

  checkConflicted(block: Format, token: Token, cursor: Cursor = {}) {
    const anchor = cursor.anchor || cursor.start;
    const focus = cursor.focus || cursor.end;
    if (!anchor || !focus || (cursor.block && cursor.block !== block)) {
      return false;
    }

    const { start, end } = token.range;

    return (
      conflict([start, end], [anchor.offset, anchor.offset]) ||
      conflict([start, end], [focus.offset, focus.offset])
    );
  }

  getClassName(
    outerClass: string | undefined,
    block: Format,
    token: Token,
    cursor: Cursor
  ) {
    return (
      outerClass ||
      (this.checkConflicted(block, token, cursor)
        ? CLASS_NAMES.MU_GRAY
        : CLASS_NAMES.MU_HIDE)
    );
  }

  getHighlightClassName(active: boolean) {
    return active ? CLASS_NAMES.MU_HIGHLIGHT : CLASS_NAMES.MU_SELECTION;
  }

  output(tokens: Token[], block: Format, cursor: Cursor) {
    const children: VNode[] = tokens.reduce(
      (acc, token) => [
        ...acc,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(this as any)[snakeToCamel(token.type)]({
          h,
          cursor,
          block,
          token,
        }),
      ],
      [] as VNode[]
    );
    const vNode = h("span", children);
    const rawHtml = toHTML(vNode);

    return rawHtml.replace(/^<span>([\s\S]*)<\/span>$/g, (_, p) => p);
  }
}

export default Renderer;
