// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';
import { tokenizer } from '../lexer';

// Defensive regression tests for the CommonMark 0.29 spec examples that the
// legacy marktext inline lexer used to fail before commit 57cd04c5 (Apr 2019,
// marktext PR #957). The new muya's inline lexer (`validateEmphasize` +
// `lowerPriority`) implements the CommonMark left/right-flanking rules and
// the §6.4 rule that "inline code spans, links, images, and HTML tags group
// more tightly than emphasis", so these inputs are already correct. We lock
// the behaviour in so future inline-lexer refactors can't regress it.
//
// We assert on the *shape* of the resulting token stream rather than running
// the full markdown→HTML pipeline, because the inline lexer is what marktext
// patched and what the new muya forked from.

function topTypes(src: string): string[] {
    return tokenizer(src).map(t => t.type);
}

describe('inline lexer — CommonMark 0.29 spec examples (marktext 57cd04c5)', () => {
    // §6.4 example 475 — `**<a href="**">`
    // Stars are inside an HTML attribute value, so neither pair may open or
    // close a strong-emphasis span. Output should be `<p>**<a href="**"></p>`.
    it('example 475: `**` inside an HTML attribute does not start strong', () => {
        const types = topTypes('**<a href="**">');
        expect(types, `tokens: ${JSON.stringify(types)}`).not.toContain('strong');
        expect(types).not.toContain('em');
    });

    // §6.4 example 353 — `* a *` with non-breaking spaces (U+00A0) around `a`.
    // Non-breaking space counts as Unicode whitespace, so the surrounding `*`
    // markers are followed/preceded by whitespace and cannot open emphasis.
    it('example 353: `*` adjacent to non-breaking space does not open em', () => {
        const types = topTypes('* a *');
        expect(types, `tokens: ${JSON.stringify(types)}`).not.toContain('em');
        expect(types).not.toContain('strong');
    });

    // §6.4 example 387 — `пристаням__стремятся__`
    // The intraword `__` rule says `_` flanked by alphanumerics on both sides
    // cannot open or close emphasis. Output is literal text.
    it('example 387: intraword `__` does not open em or strong', () => {
        const types = topTypes('пристаням__стремятся__');
        expect(types, `tokens: ${JSON.stringify(types)}`).not.toContain('em');
        expect(types).not.toContain('strong');
    });

    // §6.6 example 520 — `[foo <bar attr="](baz)">`
    // The HTML tag spans across what would otherwise be a link closer, and
    // because HTML tags have higher precedence than links the input emits an
    // html_tag (or plain text), never a link.
    it('example 520: HTML tag takes precedence over a tentative link', () => {
        const types = topTypes('[foo <bar attr="](baz)">');
        expect(types, `tokens: ${JSON.stringify(types)}`).not.toContain('link');
        expect(types).not.toContain('reference_link');
    });

    // §6.6 example 521 — `[foo` + backtick code span + `](/uri)`
    // A code span sits inside what looks like a link, but code spans take
    // precedence, so the link never forms.
    it('example 521: code span takes precedence over a tentative link', () => {
        const types = topTypes('[foo`](/uri)`');
        expect(types, `tokens: ${JSON.stringify(types)}`).not.toContain('link');
        expect(types).not.toContain('reference_link');
        expect(types).toContain('inline_code');
    });
});
