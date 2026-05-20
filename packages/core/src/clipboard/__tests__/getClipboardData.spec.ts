import type { Muya } from '../../muya';
import { describe, expect, it, vi } from 'vitest';

// Same prism stub as copyHandler.spec — the import graph touches `window`.
vi.mock('../../utils/prism/index', () => ({
    default: {},
    walkTokens: () => null,
    loadedLanguages: new Set(),
    transformAliasToOrigin: (s: string) => s,
    loadLanguage: () => null,
    search: () => [],
}));

const Clipboard = (await import('../index')).default;

// Regression for marktext commits 393139e5 (#2197 — "unnecessary character
// sanitation on clipboard output") and dc54c7b6-adjacent code-content path:
// the text copied to the clipboard from a single-block selection MUST NOT be
// HTML-escaped. The user copied `<`, they should get `<` on the clipboard,
// not `&lt;`.

function fakeMuya() {
    return {
        options: { frontMatter: true },
    } as unknown as Muya;
}

function selectionOver(text: string, begin: number, end: number) {
    return {
        isSelectionInSameBlock: true,
        anchor: { offset: begin },
        focus: { offset: end },
        anchorBlock: { text } as any,
        focusBlock: { text } as any,
    };
}

function makeClipboard(text: string, begin: number, end: number) {
    const clipboard = new Clipboard(fakeMuya());
    Object.defineProperty(clipboard, 'selection', {
        get: () => ({ getSelection: () => selectionOver(text, begin, end) }),
    });
    Object.defineProperty(clipboard, 'scrollPage', { get: () => null });
    return clipboard;
}

describe('clipboard.getClipboardData — single-block selection is not HTML-escaped', () => {
    it('preserves angle brackets and ampersands verbatim in text/plain', () => {
        const clipboard = makeClipboard('a <b> & "c"', 0, 11);

        const { text } = clipboard.getClipboardData();

        expect(text).toBe('a <b> & "c"');
    });

    it('returns empty text when the selection is collapsed', () => {
        const clipboard = makeClipboard('hello', 2, 2);

        const { text } = clipboard.getClipboardData();

        expect(text).toBe('');
    });
});
