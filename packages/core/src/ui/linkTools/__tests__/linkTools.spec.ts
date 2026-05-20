// @vitest-environment happy-dom
import type { Muya } from '../../../muya';
import { describe, expect, it, vi } from 'vitest';
import EventCenter from '../../../event';
import LinkTools from '../index';

// P3 defensive lock for marktext `1ef0d016` (link tools — unlink / jump).
// The new linkTools subscriber + `selectItem` dispatcher is fully staged
// in muya but there's no emitter for `muya-link-tools` yet, so neither
// the unlink path nor the jump path is exercised end-to-end. Without a
// test pinning the dispatch, a future refactor (e.g. renaming `unlink` /
// `jumpClick`, or swapping the switch on `item.type`) would silently
// regress the structure when the wiring is finally completed.
//
// These tests stub the floating-tool DOM surface and the eventCenter,
// then poke `selectItem` directly to verify each branch dispatches to
// the right collaborator.

function makeFakeMuya(unlink: (info: unknown) => void): Muya {
    const eventCenter = new EventCenter();
    const domNode = document.createElement('div');
    document.body.appendChild(domNode);
    // The constructor of LinkTools chains through BaseFloat.listen(), which
    // attaches a scroll handler to `domNode.parentElement`. document.body is
    // the parent so that's fine here.
    const fakeMuya = {
        eventCenter,
        domNode,
        contentState: { unlink },
    } as unknown as Muya;
    return fakeMuya;
}

function makeFakeEvent() {
    return {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
    } as unknown as Event;
}

describe('linkTools.selectItem — dispatches to contentState / jumpClick', () => {
    it('unlink: routes to muya.contentState.unlink with the captured linkInfo', () => {
        const unlink = vi.fn();
        const muya = makeFakeMuya(unlink);
        const tools = new LinkTools(muya);

        const linkInfo = { href: 'https://example.com', text: 'hi' };
        tools.linkInfo = linkInfo;

        tools.selectItem(makeFakeEvent(), { type: 'unlink', icon: '' });

        expect(unlink).toHaveBeenCalledTimes(1);
        expect(unlink).toHaveBeenCalledWith(linkInfo);
    });

    it('jump: routes to options.jumpClick with the captured linkInfo', () => {
        const unlink = vi.fn();
        const jumpClick = vi.fn();
        const muya = makeFakeMuya(unlink);
        const tools = new LinkTools(muya, { jumpClick });

        const linkInfo = { href: 'https://example.com' };
        tools.linkInfo = linkInfo;

        tools.selectItem(makeFakeEvent(), { type: 'jump', icon: '' });

        expect(jumpClick).toHaveBeenCalledTimes(1);
        expect(jumpClick).toHaveBeenCalledWith(linkInfo);
        // The unlink path must not fire on jump.
        expect(unlink).not.toHaveBeenCalled();
    });
});
