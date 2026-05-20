import type { Muya } from '../muya';
import { CLASS_NAMES } from '../config';
import { getLinkInfo } from '../utils/getLinkInfo';

// Port of marktext `src/muya/lib/eventHandler/mouseEvent.js` (cb25b3d4
// + the surrounding hover dispatch infrastructure). The new repo's
// linkTools popover subscribes to `muya-link-tools` but had no emitter;
// this module is that emitter.
//
// Three rendered link variants are detected, each by its wrapper class:
//   - markdown `[text](href)`      → span.mu-inline-rule.mu-link
//   - reference link `[label][ref]` → a.mu-inline-rule.mu-reference-link
//                                       (or span.mu-reference-link if href
//                                        is not yet resolved — those are
//                                        still hover targets so the user
//                                        can see "no definition")
//   - HTML `<a href=...>`          → a.mu-inline-rule.mu-raw-html
//
// For the markdown and reference-link variants we additionally require
// the preceding sibling to be `.mu-hide` — i.e. the source-character
// markers are hidden, which means the wrapper is rendered in *preview*
// mode (cursor isn't editing inside the link). This mirrors marktext's
// `parentPreSibling.classList.contains('ag-hide')` guard and keeps the
// popover from flashing while the user types the URL.
//
// `attachLinkMouseHandlers` returns a cleanup function the caller is
// expected to invoke on editor destroy.

const LINK_SELECTOR = [
    `.${CLASS_NAMES.MU_LINK}`,
    `.${CLASS_NAMES.MU_REFERENCE_LINK}`,
    `.${CLASS_NAMES.MU_RAW_HTML}`,
].join(', ');

function findLinkWrapper(target: EventTarget | null): HTMLElement | null {
    if (!(target instanceof HTMLElement))
        return null;

    return target.closest<HTMLElement>(LINK_SELECTOR);
}

function isPopoverTarget(wrapper: HTMLElement): boolean {
    // HTML `<a>` is always a popover target — no source markers to hide.
    if (wrapper.classList.contains(CLASS_NAMES.MU_RAW_HTML))
        return true;

    // Markdown link / reference link: only show in preview mode (the
    // preceding `[` marker is hidden via `.mu-hide`).
    const prev = wrapper.previousElementSibling;

    return !!prev && prev.classList.contains(CLASS_NAMES.MU_HIDE);
}

export function attachLinkMouseHandlers(muya: Muya): () => void {
    const { eventCenter, domNode } = muya;

    const overHandler = (event: Event) => {
        const wrapper = findLinkWrapper(event.target);
        if (!wrapper || !isPopoverTarget(wrapper))
            return;

        eventCenter.emit('muya-link-tools', {
            reference: wrapper,
            linkInfo: getLinkInfo(wrapper),
        });
    };

    const outHandler = (event: Event) => {
        const wrapper = findLinkWrapper(event.target);
        if (!wrapper)
            return;

        eventCenter.emit('muya-link-tools', { reference: null });
    };

    const overId = eventCenter.attachDOMEvent(domNode, 'mouseover', overHandler);
    const outId = eventCenter.attachDOMEvent(domNode, 'mouseout', outHandler);

    return () => {
        eventCenter.detachDOMEvent(overId);
        eventCenter.detachDOMEvent(outId);
    };
}
