import { describe, expect, it } from 'vitest';
import {
    computeLineCount,
    LINE_NUMBERS_ROWS_CLASS,
    lineNumbersWrapperHTML,
    renderLineNumbersInnerHTML,
} from '../codeBlockLineNumbers';

// Mirrors marktext a028a7c2 ("feat: add code block line numbers") row counting.
// The trailing-newline branch produces an extra visible empty line in
// contenteditable, matching what the user sees after pressing Enter.
describe('computeLineCount', () => {
    it('counts 1 for empty string', () => {
        expect(computeLineCount('')).toBe(1);
    });

    it('counts 1 for a single line without trailing newline', () => {
        expect(computeLineCount('hello')).toBe(1);
    });

    it('counts N for N-1 inner newlines', () => {
        expect(computeLineCount('a\nb')).toBe(2);
        expect(computeLineCount('a\nb\nc')).toBe(3);
        expect(computeLineCount('a\nb\nc\nd')).toBe(4);
    });

    it('adds one extra visible row for a trailing newline', () => {
        expect(computeLineCount('a\n')).toBe(2);
        expect(computeLineCount('a\nb\n')).toBe(3);
    });

    it('treats a lone newline as two visible rows', () => {
        expect(computeLineCount('\n')).toBe(2);
    });

    it('does not collapse consecutive blank lines', () => {
        expect(computeLineCount('a\n\nb')).toBe(3);
        expect(computeLineCount('a\n\n\nb')).toBe(4);
    });
});

describe('renderLineNumbersInnerHTML', () => {
    it('emits one <span> per visible line', () => {
        expect(renderLineNumbersInnerHTML('')).toBe('<span></span>');
        expect(renderLineNumbersInnerHTML('a\nb')).toBe('<span></span><span></span>');
        expect(renderLineNumbersInnerHTML('a\nb\nc')).toBe(
            '<span></span><span></span><span></span>',
        );
    });

    it('matches computeLineCount for trailing-newline texts', () => {
        const text = 'a\nb\n';
        const innerHTML = renderLineNumbersInnerHTML(text);
        const spanCount = (innerHTML.match(/<span><\/span>/g) ?? []).length;
        expect(spanCount).toBe(computeLineCount(text));
    });
});

describe('lineNumbersWrapperHTML', () => {
    it('wraps spans in aria-hidden contenteditable=false container', () => {
        const html = lineNumbersWrapperHTML('a\nb');
        expect(html).toContain(`class="${LINE_NUMBERS_ROWS_CLASS}"`);
        expect(html).toContain('contenteditable="false"');
        expect(html).toContain('aria-hidden="true"');
        expect(html).toContain('<span></span><span></span>');
    });

    it('uses the public class name constant', () => {
        expect(LINE_NUMBERS_ROWS_CLASS).toBe('mu-line-numbers-rows');
    });
});
