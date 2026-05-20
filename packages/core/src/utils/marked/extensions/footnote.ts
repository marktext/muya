import type { MarkedExtension, Tokens } from 'marked';
import { Lexer } from 'marked';

// Block-level rule for footnote definitions. Mirrors marktext's
// src/muya/lib/parser/marked/blockRules.js after commit 1ecc3601, but
// applied at the start of the marked tokenizer's remaining source rather
// than the legacy parser's per-line buffer.
//
// The `(?<!\\)` lookbehind in front of the closing `]` lets users escape
// the bracket — `[^foo\]: bar` stays a paragraph instead of becoming a
// footnote with identifier `foo\`. The `:[\s\S]*?` after the marker uses
// `*` (not `+`) so a bare `[^id]:` followed only by a newline is still
// recognised as an empty footnote.
const BLOCK_RULE = /^\[\^([^^[\]\s]+)(?<!\\)\]:([\s\S]*?)(?=\n *\n {0,3}[^ ]|$)/;

interface IFootnoteToken {
    type: 'footnote';
    raw: string;
    identifier: string;
    tokens: Tokens.Generic[];
}

export default function footnoteExtension(): MarkedExtension {
    return {
        extensions: [
            {
                name: 'footnote',
                level: 'block',
                start(src: string) {
                    // Marked calls start() with `src.slice(1)` to look for the
                    // earliest position the paragraph should terminate at.
                    // Only signal a match when `[^id]:` follows an actual
                    // newline inside that slice — never when the slice merely
                    // begins with `[^`, because that would split paragraphs
                    // at inline footnote references like `Lorem [^1] ipsum`.
                    const m = /\n\[\^[^^[\]\s]+(?<!\\)\]:/.exec(src);
                    return m ? m.index + 1 : undefined;
                },
                tokenizer(src: string): IFootnoteToken | undefined {
                    const match = BLOCK_RULE.exec(src);
                    if (!match)
                        return;

                    const [raw, identifier, rest] = match;
                    // Strip leading whitespace after the `:` marker (so both
                    // `[^id]: text` and `[^id]:\n    text` start clean) and
                    // de-indent the 4-space continuation indent.
                    const cleaned = rest
                        .replace(/^[ \t]*/, '')
                        .replace(/^\n+/, '')
                        .replace(/\n {4}(?=\S)/g, '\n')
                        .replace(/\n+$/, '');

                    const tokens = cleaned
                        ? (new Lexer().blockTokens(cleaned) as Tokens.Generic[])
                        : [];

                    return {
                        type: 'footnote',
                        raw,
                        identifier,
                        tokens,
                    };
                },
                renderer(token) {
                    const t = token as unknown as IFootnoteToken;
                    // The parser is bound to `this` at render time.
                    const parser = (this as unknown as { parser?: { parse: (toks: Tokens.Generic[]) => string } }).parser;
                    const inner = parser ? parser.parse(t.tokens) : '';
                    return `<div class="footnote-block" data-identifier="${escapeAttr(t.identifier)}">${inner}</div>\n`;
                },
            },
        ],
    };
}

function escapeAttr(s: string): string {
    return s.replace(/[&<>"]/g, (c) => {
        switch (c) {
            case '&': return '&amp;';
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}
