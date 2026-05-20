// @vitest-environment happy-dom
import type { Muya } from '../../../muya';
import { afterEach, describe, expect, it, vi } from 'vitest';
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

interface ITestSession {
    muya: Muya;
    tools: LinkTools;
    domNode: HTMLElement;
}

const sessions: ITestSession[] = [];

function makeFakeMuya(unlink: (info: unknown) => void): { muya: Muya; domNode: HTMLElement } {
    const eventCenter = new EventCenter();
    const domNode = document.createElement('div');
    document.body.appendChild(domNode);
    // BaseFloat.listen() attaches a scroll handler to `domNode.parentElement`,
    // so `domNode` needs a parent — `document.body` here.
    const muya = {
        eventCenter,
        domNode,
        contentState: { unlink },
    } as unknown as Muya;
    return { muya, domNode };
}

interface ILinkToolsTestOptions {
    jumpClick?: (linkInfo: unknown) => void;
}

function bootLinkTools(unlink: (info: unknown) => void, options: ILinkToolsTestOptions = {}): ITestSession {
    const { muya, domNode } = makeFakeMuya(unlink);
    const tools = new LinkTools(muya, options);
    const session = { muya, tools, domNode };
    sessions.push(session);
    return session;
}

function makeFakeEvent() {
    return {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
    } as unknown as Event;
}

afterEach(() => {
    // Tear each session down: detach DOM listeners attached via EventCenter,
    // destroy the floating-tool DOM (resize observers + floatBox), and
    // unmount the host node from document.body. This prevents listener /
    // node leakage across tests in the same worker.
    while (sessions.length) {
        const { muya, tools, domNode } = sessions.pop()!;
        tools.destroy();
        muya.eventCenter.detachAllDomEvents();
        domNode.remove();
    }
});

describe('linkTools.selectItem — dispatches to contentState / jumpClick', () => {
    it('unlink: routes to muya.contentState.unlink with the captured linkInfo', () => {
        const unlink = vi.fn();
        const { tools } = bootLinkTools(unlink);

        const linkInfo = { href: 'https://example.com', text: 'hi' };
        tools.linkInfo = linkInfo;

        tools.selectItem(makeFakeEvent(), { type: 'unlink', icon: '' });

        expect(unlink).toHaveBeenCalledTimes(1);
        expect(unlink).toHaveBeenCalledWith(linkInfo);
    });

    it('jump: routes to options.jumpClick with the captured linkInfo', () => {
        const unlink = vi.fn();
        const jumpClick = vi.fn();
        const { tools } = bootLinkTools(unlink, { jumpClick });

        const linkInfo = { href: 'https://example.com' };
        tools.linkInfo = linkInfo;

        tools.selectItem(makeFakeEvent(), { type: 'jump', icon: '' });

        expect(jumpClick).toHaveBeenCalledTimes(1);
        expect(jumpClick).toHaveBeenCalledWith(linkInfo);
        // The unlink path must not fire on jump.
        expect(unlink).not.toHaveBeenCalled();
    });
});
