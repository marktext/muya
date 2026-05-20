// @vitest-environment happy-dom

import type { Muya } from '../../muya';
import { afterEach, describe, expect, it } from 'vitest';
import EventCenter from '../../event';
import { attachLinkMouseHandlers } from '../linkMouseEvents';

// Regression tests for marktext commit cb25b3d4 (#1415).
// The renderer side of the port already emits dataset.{start,end,raw}
// + the right wrapper classes for all three link variants (markdown
// `[]()`, reference link, html_tag `<a>`). PR-11b builds the missing
// emitter — mouseover/mouseout on the rendered wrapper dispatches
// `muya-link-tools` so the staged LinkTools popover (PR-9-tidy) finally
// lights up.

function makeMuya() {
    const eventCenter = new EventCenter();
    const domNode = document.createElement('div');
    document.body.appendChild(domNode);
    return {
        eventCenter,
        domNode,
        muya: { eventCenter, domNode } as unknown as Muya,
    };
}

const cleanup: Array<() => void> = [];

afterEach(() => {
    while (cleanup.length)
        cleanup.pop()!();
    document.body.innerHTML = '';
});

function captureEmits(eventCenter: EventCenter) {
    const emits: any[] = [];
    eventCenter.subscribe('muya-link-tools', (payload: any) => emits.push(payload));
    return emits;
}

function mouseover(el: HTMLElement) {
    el.dispatchEvent(new Event('mouseover', { bubbles: true }));
}

function mouseout(el: HTMLElement) {
    el.dispatchEvent(new Event('mouseout', { bubbles: true }));
}

describe('linkMouseEvents — dispatches muya-link-tools on hover', () => {
    it('emits on mouseover of a markdown link `<span class="mu-link">` in preview mode', () => {
        const { muya, eventCenter, domNode } = makeMuya();
        const emits = captureEmits(eventCenter);
        cleanup.push(attachLinkMouseHandlers(muya));

        // Preview-mode link: the leading `[` marker is `.mu-hide`, so the
        // wrapper is the rendered popover target.
        const marker = document.createElement('span');
        marker.classList.add('mu-hide');
        const link = document.createElement('span');
        link.classList.add('mu-inline-rule', 'mu-link');
        link.dataset.raw = '[hi](https://x.com)';
        link.dataset.start = '0';
        link.dataset.end = '19';
        (link as any).href = 'https://x.com';
        link.textContent = 'hi';
        domNode.appendChild(marker);
        domNode.appendChild(link);

        mouseover(link);
        expect(emits).toHaveLength(1);
        expect(emits[0].reference).toBe(link);
        expect(emits[0].linkInfo?.href).toBe('https://x.com');
    });

    it('emits on mouseover of a reference link `<a class="mu-reference-link">`', () => {
        const { muya, eventCenter, domNode } = makeMuya();
        const emits = captureEmits(eventCenter);
        cleanup.push(attachLinkMouseHandlers(muya));

        // Preview-mode wrapper as before — refLink also has a leading marker.
        const marker = document.createElement('span');
        marker.classList.add('mu-hide');
        const link = document.createElement('a');
        link.classList.add('mu-inline-rule', 'mu-reference-link');
        link.setAttribute('href', 'https://example.com');
        link.dataset.raw = '[foo][bar]';
        link.dataset.start = '0';
        link.dataset.end = '10';
        link.textContent = 'foo';
        domNode.appendChild(marker);
        domNode.appendChild(link);

        mouseover(link);
        expect(emits).toHaveLength(1);
        expect(emits[0].linkInfo?.href).toBe('https://example.com');
    });

    it('emits on mouseover of an html_tag `<a class="mu-raw-html">` (no marker required)', () => {
        const { muya, eventCenter, domNode } = makeMuya();
        const emits = captureEmits(eventCenter);
        cleanup.push(attachLinkMouseHandlers(muya));

        // html_tag <a> doesn't have a "hidden source marker" sibling —
        // the inline rendering already IS the rendered form.
        const link = document.createElement('a');
        link.classList.add('mu-inline-rule', 'mu-raw-html');
        link.setAttribute('href', 'https://x.com');
        link.dataset.raw = '<a href="https://x.com">x</a>';
        link.dataset.start = '5';
        link.dataset.end = '34';
        link.textContent = 'x';
        domNode.appendChild(link);

        mouseover(link);
        expect(emits).toHaveLength(1);
        expect(emits[0].linkInfo?.href).toBe('https://x.com');
    });

    it('emits with reference: null on mouseout of a link', () => {
        const { muya, eventCenter, domNode } = makeMuya();
        const emits = captureEmits(eventCenter);
        cleanup.push(attachLinkMouseHandlers(muya));

        const link = document.createElement('a');
        link.classList.add('mu-inline-rule', 'mu-raw-html');
        link.setAttribute('href', 'https://x.com');
        link.dataset.raw = '<a href="https://x.com">x</a>';
        domNode.appendChild(link);

        mouseover(link);
        emits.length = 0;
        mouseout(link);
        expect(emits).toHaveLength(1);
        expect(emits[0].reference).toBeNull();
    });

    it('does NOT emit on mouseover of a non-link element', () => {
        const { muya, eventCenter, domNode } = makeMuya();
        const emits = captureEmits(eventCenter);
        cleanup.push(attachLinkMouseHandlers(muya));

        const para = document.createElement('p');
        para.textContent = 'plain text';
        domNode.appendChild(para);

        mouseover(para);
        expect(emits).toHaveLength(0);
    });

    it('does NOT emit when the markdown link is in EDIT mode (no hidden marker sibling)', () => {
        const { muya, eventCenter, domNode } = makeMuya();
        const emits = captureEmits(eventCenter);
        cleanup.push(attachLinkMouseHandlers(muya));

        // Edit-mode link: previous sibling is mu-gray (visible), not mu-hide.
        const marker = document.createElement('span');
        marker.classList.add('mu-gray');
        const link = document.createElement('span');
        link.classList.add('mu-inline-rule', 'mu-link');
        link.dataset.raw = '[hi](https://x.com)';
        domNode.appendChild(marker);
        domNode.appendChild(link);

        mouseover(link);
        expect(emits).toHaveLength(0);
    });

    it('detaches all handlers when the returned cleanup runs (no leakage)', () => {
        const { muya, eventCenter, domNode } = makeMuya();
        const emits = captureEmits(eventCenter);
        const detach = attachLinkMouseHandlers(muya);

        const link = document.createElement('a');
        link.classList.add('mu-inline-rule', 'mu-raw-html');
        link.setAttribute('href', 'https://x.com');
        link.dataset.raw = '<a href="https://x.com">x</a>';
        domNode.appendChild(link);

        detach();
        mouseover(link);
        expect(emits).toHaveLength(0);
    });
});
