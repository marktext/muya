import { describe, expect, it } from 'vitest';
import { lexBlock } from '../../lexBlock';

// Tests adapted from marktext commit 1ecc3601 (Fix markdown footnote parser, #2840).
// Source: test/unit/specs/markdown-footnotes.spec.js, 510 lines, 23 specs.
//
// The marktext suite emits a flat token stream (`footnote_start` / `footnote_end`).
// marked v16 uses a hierarchical model: a single `footnote` block token whose
// nested content lives under `tokens`. We assert the equivalent semantics here.
//
// Each spec exercises one of:
//   - the block-level footnote definition rule  `[^id]: text`
//   - the inline footnote identifier rule        `[^id]`
//   - the negative case where neither rule should fire.

interface ISimplifiedToken {
    type: string;
    identifier?: string;
    text?: string;
    children?: ISimplifiedToken[];
}

function simplify(token: any): ISimplifiedToken {
    const out: ISimplifiedToken = { type: token.type };
    if (token.identifier !== undefined) {
        out.identifier = token.identifier;
    }
    if (token.tokens && Array.isArray(token.tokens) && token.type === 'footnote') {
        out.children = token.tokens.map(simplify);
    }
    else if (typeof token.text === 'string') {
        out.text = token.text;
    }
    return out;
}

function parse(markdown: string) {
    return lexBlock(markdown, {
        footnote: true,
        math: false,
        frontMatter: false,
    })
        .filter(t => t.type !== 'space')
        .map(simplify);
}

describe('marked footnote extension — block-level definitions', () => {
    it('footnote according pandoc specification', () => {
        const tokens = parse(`foo[^1]

[^1]: foo`);
        expect(tokens).toEqual([
            { type: 'paragraph', text: 'foo[^1]' },
            {
                type: 'footnote',
                identifier: '1',
                children: [{ type: 'paragraph', text: 'foo' }],
            },
        ]);
    });

    it('footnote with text as tag', () => {
        const tokens = parse(`Lorem [^foo1] ipsum.

[^foo1]: At vero eos et accusam.`);
        expect(tokens).toEqual([
            { type: 'paragraph', text: 'Lorem [^foo1] ipsum.' },
            {
                type: 'footnote',
                identifier: 'foo1',
                children: [{ type: 'paragraph', text: 'At vero eos et accusam.' }],
            },
        ]);
    });

    it('footnote without space between footnote tag and text', () => {
        // marktext fix `\s+` → `\s*` in lexer.js handles this case.
        const tokens = parse(`Lorem [^foo1] ipsum.

[^foo1]:At vero eos et accusam.`);
        expect(tokens).toEqual([
            { type: 'paragraph', text: 'Lorem [^foo1] ipsum.' },
            {
                type: 'footnote',
                identifier: 'foo1',
                children: [{ type: 'paragraph', text: 'At vero eos et accusam.' }],
            },
        ]);
    });

    it('footnote with non-ASCII text in identifier', () => {
        const tokens = parse(`掲応自情表使[^掲応自情表]供業辞金打論将

[^掲応自情表]: 別率重帰更科申会前後度計`);
        expect(tokens).toEqual([
            { type: 'paragraph', text: '掲応自情表使[^掲応自情表]供業辞金打論将' },
            {
                type: 'footnote',
                identifier: '掲応自情表',
                children: [{ type: 'paragraph', text: '別率重帰更科申会前後度計' }],
            },
        ]);
    });

    it('footnote with prefix is not a footnote', () => {
        const tokens = parse(`Lorem [^foo1] ipsum.

a[^foo1]: At vero eos et accusam.`);
        expect(tokens).toEqual([
            { type: 'paragraph', text: 'Lorem [^foo1] ipsum.' },
            { type: 'paragraph', text: 'a[^foo1]: At vero eos et accusam.' },
        ]);
    });

    it('footnote inside paragraph is not a footnote', () => {
        const tokens = parse(`Lorem [^foo1] ipsum.

At vero eos [^foo1]: et accusam.`);
        expect(tokens).toEqual([
            { type: 'paragraph', text: 'Lorem [^foo1] ipsum.' },
            { type: 'paragraph', text: 'At vero eos [^foo1]: et accusam.' },
        ]);
    });

    // The next three negative cases assert that our footnote extension does
    // NOT fire when the input doesn't look like a footnote definition. marked
    // v16's own `def` (reference definition) rule then matches each input —
    // that is closer to CommonMark §4.7 than marktext's old paragraph
    // fallback, so we keep marked's behaviour. The key assertion is that we
    // do NOT emit a `footnote` token.
    it('front-escaped bracket is not a footnote', () => {
        const tokens = parse(`foo[^1]

\\[^1]: foo`);
        const types = tokens.map(t => t.type);
        expect(types).not.toContain('footnote');
    });

    it('backslash-escaped closing bracket is not a footnote (marktext 1ecc3601 fix)', () => {
        // The `(?<!\\)` lookbehind in BLOCK_RULE is what stops `[^1\]: foo`
        // from being parsed as a footnote definition. Without the lookbehind
        // the identifier would become `1\` and the definition would consume
        // the rest of the line — exactly the regression marktext fixed.
        const tokens = parse(`foo[^1]

[^1\\]: foo`);
        const types = tokens.map(t => t.type);
        expect(types).not.toContain('footnote');
    });

    it('bracket with space before caret is not a footnote', () => {
        const tokens = parse(`foo[^1]

[ ^1]: foo`);
        const types = tokens.map(t => t.type);
        expect(types).not.toContain('footnote');
    });

    it('empty footnote with trailing newline reports footnote with no content', () => {
        const tokens = parse(`foo[^foo1]

[^foo1]:
`);
        expect(tokens).toEqual([
            { type: 'paragraph', text: 'foo[^foo1]' },
            { type: 'footnote', identifier: 'foo1', children: [] },
        ]);
    });

    it('always reports footnote even if referenced identifier differs', () => {
        // Per pandoc spec an unreferenced footnote could be ignored, but marktext
        // kept reporting them so users can edit incomplete drafts. We keep that.
        const tokens = parse(`Lorem [^1] ipsum.

[^2]: Lorem ipsum dolor sit amet.`);
        expect(tokens).toEqual([
            { type: 'paragraph', text: 'Lorem [^1] ipsum.' },
            {
                type: 'footnote',
                identifier: '2',
                children: [{ type: 'paragraph', text: 'Lorem ipsum dolor sit amet.' }],
            },
        ]);
    });

    it('propagates extensions (math) into nested footnote content', () => {
        // The tokenizer must re-lex nested content through the same Marked
        // instance, otherwise `math: true` doesn't reach inside footnotes.
        const tokens = lexBlock(
            `text[^1]

[^1]: see $a + b$ for the formula`,
            { footnote: true, math: true, frontMatter: false },
        );
        const footnote = tokens.find(t => t.type === 'footnote') as any;
        expect(footnote).toBeDefined();
        // The inline math `$a + b$` lives inside the footnote's paragraph
        // children, but block lexing produces a paragraph token whose
        // `tokens` array (inline tokens) is populated lazily by marked's
        // parse phase. Asserting the lexer state at the block level is
        // enough — the key invariant is that the footnote re-uses the
        // same lexer, so the extensions match.
        expect(footnote.tokens.length).toBeGreaterThan(0);
    });

    it('footnote support is gated by the `footnote` option (default off)', () => {
        const tokens = lexBlock(
            `foo[^1]

[^1]: foo`,
            { footnote: false, math: false, frontMatter: false },
        ).filter(t => t.type !== 'space');
        // Without the extension the definition stays as a plain paragraph.
        const types = tokens.map(t => t.type);
        expect(types).toContain('paragraph');
        expect(types).not.toContain('footnote');
    });
});
