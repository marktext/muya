import type { VNode } from 'snabbdom';
import { BLOCK_TYPE6, CLASS_NAMES } from '../../config';
import { snakeToCamel } from '../../utils';
import sanitize, { isValidAttribute } from '../../utils/dompurify';
import type { HTMLTagToken, ISyntaxRenderOptions, ImageToken, Token } from '../types';
import type Renderer from './index';

export default function htmlTag(
    this: Renderer,
    {
        h,
        cursor,
        block,
        token,
        outerClass,
    }: ISyntaxRenderOptions & { token: HTMLTagToken },
) {
    const { tag, openTag, closeTag, children, attrs } = token;

    const className = children?.length
        ? this.getClassName(outerClass, block, token, cursor)
        : CLASS_NAMES.MU_GRAY;
    const tagClassName
    = className === CLASS_NAMES.MU_HIDE ? className : CLASS_NAMES.MU_HTML_TAG;
    const { start, end } = token.range;
    const openContent = this.highlight(
        h,
        block,
        start,
        start + openTag.length,
        token,
    );
    const closeContent = closeTag
        ? this.highlight(h, block, end - closeTag.length, end, token)
        : '';

    const anchor
    = Array.isArray(children) && children.length && tag !== 'ruby' // important
        ? children.reduce((acc: VNode[], to: Token) => {
            const chunk = (this as any)[snakeToCamel(to.type)]({
                h,
                cursor,
                block,
                token: to,
                className,
            });

            return Array.isArray(chunk) ? [...acc, ...chunk] : [...acc, chunk];
        }, [])
        : '';

    switch (tag) {
    // Handle html img.
        case 'img': {
            return this.image({ h, cursor, block, token: token as unknown as ImageToken, outerClass });
        }

        case 'br': {
            return [h(`span.${CLASS_NAMES.MU_HTML_TAG}`, [...openContent, h(tag)])];
        }

        default:
            // handle void html tag
            if (!closeTag) {
                return [h(`span.${CLASS_NAMES.MU_HTML_TAG}`, openContent)];
            }
            else if (tag === 'ruby') {
                return this.htmlRuby({
                    h,
                    cursor,
                    block,
                    token,
                    outerClass,
                });
            }
            else {
                // if  tag is a block level element, use a inline element `span` to instead.
                // Because we can not nest a block level element in span element(line is span element)
                // we also recommand user not use block level element in paragraph. use block element in html block.
                // Use code !sanitize(`<${tag}>`) to filter some malicious tags. for example: <embed>.
                let selector
          = BLOCK_TYPE6.includes(tag) || !sanitize(`<${tag}>`) ? 'span' : tag;
                selector += `.${CLASS_NAMES.MU_INLINE_RULE}.${CLASS_NAMES.MU_RAW_HTML}`;
                const data = {
                    attrs: {} as Record<string, string>,
                    dataset: {
                        start: String(start),
                        end: String(end),
                        raw: token.raw,
                    },
                };

                // Disable spell checking for these tags
                if (tag === 'code' || tag === 'kbd')
                    Object.assign(data.attrs, { spellcheck: 'false' });

                if (attrs.id)
                    selector += `#${attrs.id}`;

                if (attrs.class && /\S/.test(attrs.class)) {
                    const classNames = attrs.class.split(/\s+/);

                    for (const className of classNames)
                        selector += `.${className}`;
                }

                for (const attr of Object.keys(attrs)) {
                    if (attr !== 'id' && attr !== 'class') {
                        const attrData = attrs[attr];
                        if (attrData && isValidAttribute(tag, attr, attrData))
                            data.attrs[attr] = attrData;
                    }
                }

                return [
                    h(
            `span.${tagClassName}.${CLASS_NAMES.MU_OUTPUT_REMOVE}`,
            {
                attrs: {
                    spellcheck: 'false',
                },
            },
            openContent,
                    ),
                    h(`${selector}`, data, anchor),
                    h(
            `span.${tagClassName}.${CLASS_NAMES.MU_OUTPUT_REMOVE}`,
            {
                attrs: {
                    spellcheck: 'false',
                },
            },
            closeContent,
                    ),
                ];
            }
    }
}
