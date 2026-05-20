import { describe, expect, it } from 'vitest';
import { mergePasteIntoHeading } from '../mergePasteIntoHeading';

// Regression for marktext commit 1c42555a (#671):
// "allow pasting multi-line text into a heading".
//
// Old behaviour: pasting multi-paragraph markdown into a heading kept the
// heading untouched and inserted ALL paragraphs as new blocks below.
// Expected behaviour: the first paragraph is merged into the heading (so
// the heading still feels like one continuous line at the cursor position),
// and the remaining paragraphs become regular paragraph blocks below the
// heading.
//
// `mergePasteIntoHeading` is the pure helper that decides whether to merge
// and, if so, mutates the heading's text and returns the remaining states.

interface FakeContent {
    text: string;
    updated: boolean;
    update: () => void;
}

function content(text: string): FakeContent {
    const block: FakeContent = {
        text,
        updated: false,
        update() {
            this.updated = true;
        },
    };
    return block;
}

describe('mergePasteIntoHeading', () => {
    it('merges first paragraph state into an atx heading and returns the rest', () => {
        const heading = content('Title');
        const states = [
            { name: 'paragraph', text: 'Hello' },
            { name: 'paragraph', text: 'World' },
        ];

        const remaining = mergePasteIntoHeading(
            heading as any,
            { blockName: 'atx-heading' } as any,
            states as any,
            { startOffset: 5, endOffset: 5 },
        );

        expect(heading.text).toBe('TitleHello');
        expect(heading.updated).toBe(true);
        expect(remaining).toEqual([{ name: 'paragraph', text: 'World' }]);
    });

    it('also merges into setext heading', () => {
        const heading = content('Title');
        const states = [
            { name: 'paragraph', text: 'Hello' },
            { name: 'paragraph', text: 'World' },
        ];

        const remaining = mergePasteIntoHeading(
            heading as any,
            { blockName: 'setext-heading' } as any,
            states as any,
            { startOffset: 5, endOffset: 5 },
        );

        expect(heading.text).toBe('TitleHello');
        expect(remaining).toEqual([{ name: 'paragraph', text: 'World' }]);
    });

    it('honours an existing selection on the heading by collapsing the selected range first', () => {
        const heading = content('Title XXX'); // user selected "XXX" before pasting
        const states = [
            { name: 'paragraph', text: 'Hello' },
            { name: 'paragraph', text: 'World' },
        ];

        const remaining = mergePasteIntoHeading(
            heading as any,
            { blockName: 'atx-heading' } as any,
            states as any,
            { startOffset: 6, endOffset: 9 },
        );

        expect(heading.text).toBe('Title Hello');
        expect(remaining).toEqual([{ name: 'paragraph', text: 'World' }]);
    });

    it('returns the original states unchanged when wrapper is not a heading', () => {
        const para = content('Foo');
        const states = [
            { name: 'paragraph', text: 'A' },
            { name: 'paragraph', text: 'B' },
        ];

        const remaining = mergePasteIntoHeading(
            para as any,
            { blockName: 'paragraph' } as any,
            states as any,
            { startOffset: 3, endOffset: 3 },
        );

        expect(para.text).toBe('Foo');
        expect(para.updated).toBe(false);
        expect(remaining).toBe(states);
    });

    it('returns the original states when first state is not a paragraph', () => {
        const heading = content('Title');
        const states = [
            { name: 'code-block', text: 'console.log()' },
            { name: 'paragraph', text: 'after' },
        ];

        const remaining = mergePasteIntoHeading(
            heading as any,
            { blockName: 'atx-heading' } as any,
            states as any,
            { startOffset: 5, endOffset: 5 },
        );

        expect(heading.text).toBe('Title');
        expect(heading.updated).toBe(false);
        expect(remaining).toBe(states);
    });

    it('returns an empty array when states is empty (no-op)', () => {
        const heading = content('Title');

        const remaining = mergePasteIntoHeading(
            heading as any,
            { blockName: 'atx-heading' } as any,
            [],
            { startOffset: 5, endOffset: 5 },
        );

        expect(heading.text).toBe('Title');
        expect(remaining).toEqual([]);
    });
});
