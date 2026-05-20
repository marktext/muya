import { describe, expect, it } from 'vitest';
import superSubScriptExtension from '../superSubscript';

// Regression for marktext commit b8e2cd82 "Fix inline html renderer (#2224)".
//
// marktext's old `textRenderer.js` was missing a `script` method, so even
// when its tokenizer produced `superscript` / `subscript` tokens the marked
// renderer dropped them to plain text on HTML export/clipboard. b8e2cd82
// added:
//
//     TextRenderer.prototype.script = function (content, marker) {
//       const tagName = marker === '^' ? 'sup' : 'sub'
//       return `<${tagName}>${content}</${tagName}>`
//     }
//
// New muya: `utils/marked/extensions/superSubscript.ts` registers two
// marked extensions whose `renderer(token)` returns
// `<${tagName}>${text}</${tagName}>`. The renderer + tokenizer are what
// b8e2cd82 was missing — the snabbdom-side in-editor renderer
// (`inlineRenderer/renderer/superSubScript.ts`) is a separate, parallel
// path that has always worked. These tests pin the renderer contract that
// b8e2cd82 introduced.
//
// (Note: hooking these tokens into the marked v16 inline pass via the
// `start` regex is a separate, pre-existing concern that does not affect
// b8e2cd82's contract — that contract is purely "given a {marker,text}
// token, the renderer emits the correct HTML". Anything beyond that is
// out of PR-7c scope.)

describe('superSubScript marked extension — renderer emits <sup>/<sub> (marktext b8e2cd82)', () => {
    it('exposes both `superscript` and `subscript` extensions', () => {
        const ext = superSubScriptExtension();
        expect(ext.extensions).toHaveLength(2);
        expect(ext.extensions.map(e => e.name)).toEqual([
            'superscript',
            'subscript',
        ]);
    });

    it('renders a `superscript` token with marker `^` as <sup>...</sup>', () => {
        const ext = superSubScriptExtension();
        const sup = ext.extensions.find(e => e.name === 'superscript')!;
        // The tokenizer-produced token shape: {type, raw, text, marker}.
        const html = sup.renderer({
            type: 'superscript',
            raw: '^foo^',
            text: 'foo',
            marker: '^',
        } as any);
        expect(html).toBe('<sup>foo</sup>');
    });

    it('renders a `subscript` token with marker `~` as <sub>...</sub>', () => {
        const ext = superSubScriptExtension();
        const sub = ext.extensions.find(e => e.name === 'subscript')!;
        const html = sub.renderer({
            type: 'subscript',
            raw: '~bar~',
            text: 'bar',
            marker: '~',
        } as any);
        expect(html).toBe('<sub>bar</sub>');
    });

    it('renderer correctly switches tag based on marker (sup vs sub)', () => {
        // The marktext-style "switch tag based on marker" branch — pinned so
        // a refactor that hardcodes `sup` for both never sneaks in.
        const ext = superSubScriptExtension();
        const sup = ext.extensions.find(e => e.name === 'superscript')!;
        const sub = ext.extensions.find(e => e.name === 'subscript')!;

        const supHtml = sup.renderer({
            type: 'superscript',
            raw: '^a^',
            text: 'a',
            marker: '^',
        } as any);
        const subHtml = sub.renderer({
            type: 'subscript',
            raw: '~b~',
            text: 'b',
            marker: '~',
        } as any);

        expect(supHtml).toMatch(/^<sup>/);
        expect(supHtml).toMatch(/<\/sup>$/);
        expect(subHtml).toMatch(/^<sub>/);
        expect(subHtml).toMatch(/<\/sub>$/);
        expect(supHtml).not.toContain('<sub>');
        expect(subHtml).not.toContain('<sup>');
    });

    it('tokenizer round-trips `^foo^` into a {marker:^, text:foo} token', () => {
        const ext = superSubScriptExtension();
        const sup = ext.extensions.find(e => e.name === 'superscript')!;
        const token = sup.tokenizer('^foo^');
        expect(token).toEqual({
            type: 'superscript',
            raw: '^foo^',
            text: 'foo',
            marker: '^',
        });
    });

    it('tokenizer round-trips `~bar~` into a {marker:~, text:bar} token', () => {
        const ext = superSubScriptExtension();
        const sub = ext.extensions.find(e => e.name === 'subscript')!;
        const token = sub.tokenizer('~bar~');
        expect(token).toEqual({
            type: 'subscript',
            raw: '~bar~',
            text: 'bar',
            marker: '~',
        });
    });
});
