import { describe, expect, it } from 'vitest';
import Format from '../format';

// Regression for marktext UX commit `f3b53427` (kickoff PR-10b): after
// applying an inline format like **bold**, the caret should jump past the
// closing marker so the next keystroke continues *after* the bold rather
// than ending up between the markers (which feels broken — typing extends
// the bold instead of returning to body text).
//
// `Format.prototype._addFormat` is the small text-rewriter that:
//   1. Wraps `text[start..end]` with the format's opening + closing
//      markers.
//   2. Adjusts `start.offset` / `end.offset` so the public `format()` call
//      can `setCursor(start, end, true)` afterwards.
//
// Before this fix, step 2 only shifted both offsets by the opening
// marker's length, leaving the caret BETWEEN the markers. The new
// behavior collapses both offsets PAST the closing marker.
//
// `_addFormat` only reads/writes `this.text`, so a structurally-typed
// fake `this` is enough — no Muya bootstrap needed.

interface IOffset {
    offset: number;
}

function applyAddFormat(text: string, start: number, end: number, type: string) {
    const fakeThis = { text } as { text: string };
    const startOffset: IOffset = { offset: start };
    const endOffset: IOffset = { offset: end };
    // _addFormat is private; call via the prototype with a fake `this`.
    (Format.prototype as any)._addFormat.call(fakeThis, type, {
        start: startOffset,
        end: endOffset,
    });
    return { text: fakeThis.text, start: startOffset.offset, end: endOffset.offset };
}

describe('format._addFormat caret-after-format placement (marktext f3b53427 UX)', () => {
    describe('paired markdown markers — caret collapses past the closing marker', () => {
        it('strong (`**`): "abc" -> "**abc**" with caret at end (offset 7)', () => {
            const { text, start, end } = applyAddFormat('abc', 0, 3, 'strong');
            expect(text).toBe('**abc**');
            expect(start).toBe(7);
            expect(end).toBe(7);
        });

        it('em (`*`): "abc" -> "*abc*" with caret at end (offset 5)', () => {
            const { text, start, end } = applyAddFormat('abc', 0, 3, 'em');
            expect(text).toBe('*abc*');
            expect(start).toBe(5);
            expect(end).toBe(5);
        });

        it('inline_code (`` ` ``): "abc" -> "`abc`" with caret at end (offset 5)', () => {
            const { text, start, end } = applyAddFormat('abc', 0, 3, 'inline_code');
            expect(text).toBe('`abc`');
            expect(start).toBe(5);
            expect(end).toBe(5);
        });

        it('del (`~~`): "abc" -> "~~abc~~" with caret at end (offset 7)', () => {
            const { text, start, end } = applyAddFormat('abc', 0, 3, 'del');
            expect(text).toBe('~~abc~~');
            expect(start).toBe(7);
            expect(end).toBe(7);
        });

        it('inline_math (`$`): "abc" -> "$abc$" with caret at end (offset 5)', () => {
            const { text, start, end } = applyAddFormat('abc', 0, 3, 'inline_math');
            expect(text).toBe('$abc$');
            expect(start).toBe(5);
            expect(end).toBe(5);
        });

        it('mid-text selection: "hello world" select "world" -> caret lands past closing `**`', () => {
            const { text, start, end } = applyAddFormat('hello world', 6, 11, 'strong');
            expect(text).toBe('hello **world**');
            // 'hello ' (6) + '**world**' (9) = 15
            expect(start).toBe(15);
            expect(end).toBe(15);
        });
    });

    describe('html-tag markers — caret collapses past the closing tag', () => {
        it('u (`<u>...</u>`): "abc" -> "<u>abc</u>" with caret at end (offset 10)', () => {
            const { text, start, end } = applyAddFormat('abc', 0, 3, 'u');
            expect(text).toBe('<u>abc</u>');
            expect(start).toBe(10);
            expect(end).toBe(10);
        });

        it('sub: "abc" -> "<sub>abc</sub>" with caret at end (offset 14)', () => {
            const { text, start, end } = applyAddFormat('abc', 0, 3, 'sub');
            expect(text).toBe('<sub>abc</sub>');
            expect(start).toBe(14);
            expect(end).toBe(14);
        });

        it('sup: "abc" -> "<sup>abc</sup>" with caret at end (offset 14)', () => {
            const { text, start, end } = applyAddFormat('abc', 0, 3, 'sup');
            expect(text).toBe('<sup>abc</sup>');
            expect(start).toBe(14);
            expect(end).toBe(14);
        });

        it('mark: "abc" -> "<mark>abc</mark>" with caret at end (offset 16)', () => {
            const { text, start, end } = applyAddFormat('abc', 0, 3, 'mark');
            expect(text).toBe('<mark>abc</mark>');
            expect(start).toBe(16);
            expect(end).toBe(16);
        });
    });

    describe('link / image — preserve existing caret-inside-`()` behavior (unchanged)', () => {
        it('link: "abc" -> "[abc]()" with caret between `(` and `)` (offset 6)', () => {
            const { text, start, end } = applyAddFormat('abc', 0, 3, 'link');
            expect(text).toBe('[abc]()');
            expect(start).toBe(6);
            expect(end).toBe(6);
        });

        it('image: "abc" -> "![abc]()" with caret between `(` and `)` (offset 7)', () => {
            const { text, start, end } = applyAddFormat('abc', 0, 3, 'image');
            expect(text).toBe('![abc]()');
            expect(start).toBe(7);
            expect(end).toBe(7);
        });
    });
});
