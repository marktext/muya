import { beforeEach, describe, expect, it, vi } from 'vitest';
import loadImageAsync from '../loadImageAsync';

vi.mock('../../../utils/image', () => ({
    loadImage: vi.fn(() => new Promise(() => {})), // never resolves; we only test the sync decision
}));

vi.mock('../../../utils/dom', () => ({
    insertAfter: vi.fn(),
    operateClassName: vi.fn(),
}));

interface FakeRenderer {
    loadImageMap: Map<string, { id: string; isSuccess: boolean; width?: number; height?: number }>;
    urlMap: Map<string, string>;
}

function makeRenderer(): FakeRenderer {
    return {
        loadImageMap: new Map(),
        urlMap: new Map(),
    };
}

// Regression for marktext commit bca2ed62 (#3001 / #3010):
// "Internal image cache isn't reset if failed to load".
// The previous cache-key check `!this.loadImageMap.has(src)` would skip
// re-loading even after a transient failure, poisoning the entry forever.
// The fix retries whenever the cached entry has `isSuccess === false`.
describe('loadImageAsync — failed cache should retry', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns the cached info when the previous load succeeded', async () => {
        const { loadImage } = await import('../../../utils/image');
        const r = makeRenderer();
        r.loadImageMap.set('https://example.com/a.png', {
            id: 'mu-cached-success',
            isSuccess: true,
            width: 100,
            height: 50,
        });

        const out = loadImageAsync.call(
            r as unknown as Parameters<typeof loadImageAsync>[0] extends never ? never : any,
            { isUnknownType: false, src: 'https://example.com/a.png' },
            {},
        );

        expect(out).toEqual({
            id: 'mu-cached-success',
            isSuccess: true,
            width: 100,
            height: 50,
        });
        expect(loadImage).not.toHaveBeenCalled();
    });

    it('re-triggers loadImage when the previous load failed', async () => {
        const { loadImage } = await import('../../../utils/image');
        const r = makeRenderer();
        r.loadImageMap.set('https://example.com/b.png', {
            id: 'mu-cached-fail',
            isSuccess: false,
        });

        const out = loadImageAsync.call(
            r as any,
            { isUnknownType: false, src: 'https://example.com/b.png' },
            {},
        );

        // a fresh id is generated for the new attempt
        expect(out.id).not.toBe('mu-cached-fail');
        // the loader was invoked again
        expect(loadImage).toHaveBeenCalledTimes(1);
        expect(loadImage).toHaveBeenCalledWith('https://example.com/b.png', false);
    });

    it('triggers loadImage when nothing is cached', async () => {
        const { loadImage } = await import('../../../utils/image');
        const r = makeRenderer();

        loadImageAsync.call(
            r as any,
            { isUnknownType: false, src: 'https://example.com/c.png' },
            {},
        );

        expect(loadImage).toHaveBeenCalledTimes(1);
    });
});
