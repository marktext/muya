import type { Token } from 'marked';
import type { Heading, ILexOption, ListToken } from './types';
import { Marked } from 'marked';
import compatibleTaskList from './compatibleTaskList';
import footnoteExtension from './extensions/footnote';
import mathExtension from './extensions/math';
import fm from './frontMatter';
import { DEFAULT_OPTIONS } from './options';
import walkTokens from './walkTokens';

export function lexBlock(
    src: string,
    options: ILexOption = DEFAULT_OPTIONS,
): (Token | ListToken | Heading)[] {
    options = Object.assign({}, DEFAULT_OPTIONS, options);
    const { math, frontMatter, footnote } = options;
    let tokens = [];

    // Use a per-call Marked instance so extensions don't bleed across calls.
    // marked.use() on the global singleton would make math / footnote sticky:
    // any consumer that once passed `math: true` would get math parsing forever.
    const m = new Marked();

    if (math) {
        m.use(
            mathExtension({
                throwOnError: false,
                useKatexRender: false,
            }),
        );
    }

    if (footnote) {
        m.use(footnoteExtension());
    }

    if (frontMatter) {
        const { token, src: newSrc } = fm(src);
        if (token) {
            tokens.push(token);
            src = newSrc;
        }
    }

    // Pass `m.defaults` to the Lexer so the extensions registered via m.use()
    // are picked up; the no-arg constructor would fall back to global defaults.
    tokens.push(...new m.Lexer(m.defaults).blockTokens(src));
    tokens = compatibleTaskList(tokens);
    m.walkTokens(tokens, walkTokens(options));

    return tokens;
}
