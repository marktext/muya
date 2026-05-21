/// <reference types="vite/client" />

import type { Muya } from '@muyajs/core';

declare global {
    // eslint-disable-next-line ts/naming-convention -- augmenting the global Window must keep its name
    interface Window {
        // Set by host/main.ts after muya.init() so Playwright page.evaluate()
        // callbacks can drive the editor through the public API.
        muya?: Muya;

        // Test-only globals exposed by host/main.ts. Aggregated under a single
        // namespace so the real Window surface stays clean.
        __e2e?: {
            linkJumps: Array<{ href?: string }>;
            INITIAL_MARKDOWN: string;
            PICKED_IMAGE_URL: string;
            UPLOADED_IMAGE_URL: string;
        };

        // XSS canary used by tests/security/sanitize.spec.ts. If a malicious
        // payload survives sanitization and executes, it would set this flag —
        // the spec asserts it remains `undefined`.
        __pwned?: boolean;
    }

    // `Intl.Segmenter` (Stage 4, ES2022) isn't in the ES2020 lib host/ targets.
    // Mirrors the minimal shape from examples/src/vite-env.d.ts.
    namespace Intl {
        interface ISegmenterOptions {
            granularity?: 'grapheme' | 'word' | 'sentence';
        }
        interface ISegmentData {
            segment: string;
            index: number;
            input: string;
        }
        class Segmenter {
            constructor(locales?: string | string[], options?: ISegmenterOptions);
            segment(input: string): Iterable<ISegmentData>;
        }
    }
}
