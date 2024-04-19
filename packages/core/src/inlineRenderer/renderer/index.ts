/* eslint-disable ts/no-unsafe-declaration-merging */
import type { VNode } from 'snabbdom';
import type Format from '../../block/base/format';
import { CLASS_NAMES } from '../../config';
import type { Muya } from '../../index';
import type { ICursor } from '../../selection/types';
import { conflict, methodMixins, snakeToCamel } from '../../utils';
import { h, toHTML } from '../../utils/snabbdom';
import type InlineRenderer from '../index';
import type { Token } from '../types';
import autoLink from './autoLink';
import autoLinkExtension from './autoLinkExtension';
import backlash from './backlash';
import backlashInToken from './backlashInToken';
import codeFence from './codeFence';
import del from './del';
import delEmStrongFac from './delEmStrongFactory';
import em from './em';
import emoji from './emoji';
import footnoteIdentifier from './footnoteIdentifier';
import hardLineBreak from './hardLineBreak';
import header from './header';
import highlight from './highlight';
import hr from './hr';
import htmlEscape from './htmlEscape';
import htmlRuby from './htmlRuby';
import htmlTag from './htmlTag';
import image from './image';
import inlineCode from './inlineCode';
import inlineMath from './inlineMath';
import link from './link';
import loadImageAsync from './loadImageAsync';
import multipleMath from './multipleMath';
import referenceDefinition from './referenceDefinition';
import referenceImage from './referenceImage';
import referenceLink from './referenceLink';
import softLineBreak from './softLineBreak';
import strong from './strong';
import superSubScript from './superSubScript';
import tailHeader from './tailHeader';
import text from './text';

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

    checkConflicted(block: Format, token: Token, cursor: ICursor = {}) {
        const anchor = cursor.anchor || cursor.start;
        const focus = cursor.focus || cursor.end;
        if (!anchor || !focus || (cursor.block && cursor.block !== block))
            return false;

        const { start, end } = token.range;

        return (
            conflict([start, end], [anchor.offset, anchor.offset])
            || conflict([start, end], [focus.offset, focus.offset])
        );
    }

    getClassName(
        outerClass: string | undefined,
        block: Format,
        token: Token,
        cursor: ICursor,
    ) {
        return (
            outerClass
            || (this.checkConflicted(block, token, cursor)
                ? CLASS_NAMES.MU_GRAY
                : CLASS_NAMES.MU_HIDE)
        );
    }

    getHighlightClassName(active: boolean) {
        return active ? CLASS_NAMES.MU_HIGHLIGHT : CLASS_NAMES.MU_SELECTION;
    }

    output(tokens: Token[], block: Format, cursor: ICursor) {
        const children: VNode[] = tokens.reduce(
            (acc, token) => [
                ...acc,
                ...(this as any)[snakeToCamel(token.type)]({
                    h,
                    cursor,
                    block,
                    token,
                }),
            ],
            [] as VNode[],
        );
        const vNode = h('span', children);
        const rawHtml = toHTML(vNode);

        return rawHtml.replace(/^<span>([\s\S]*)<\/span>$/g, (_, p) => p);
    }
}

export default Renderer;
