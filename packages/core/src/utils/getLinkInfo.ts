// Extract the `linkInfo` payload that the linkTools popover hands back to
// `contentState.unlink` / `options.jumpClick`.
//
// Port of marktext `src/muya/lib/utils/getLinkInfo.js` (commit cb25b3d4,
// #1415). The new repo's link renderers (`link.ts`, `referenceLink.ts`,
// `htmlTag.ts`) all emit `dataset.{start,end,raw}` on the rendered link
// wrapper plus an `href` — markdown `[]()` via snabbdom `props.href`
// (DOM property on the `<span>`), HTML `<a>` and reference link via real
// `href` attribute on the `<a>`. We read both forms so the caller doesn't
// need to know which renderer produced the element.

export interface IExtractedLinkInfo {
    href: string | null;
    raw: string;
    text: string;
    range: { start: number; end: number } | null;
}

function readHref(el: HTMLElement): string | null {
    // Real attribute on a rendered <a> (reference link with resolved href,
    // or html_tag <a href=...>).
    const attr = el.getAttribute('href');
    if (attr)
        return attr;

    // snabbdom `props.href` on the markdown `<span class="mu-link">` wrapper
    // sets `elm.href` as a custom DOM property (no attribute).
    const prop = (el as unknown as { href?: unknown }).href;
    if (typeof prop === 'string' && prop)
        return prop;

    return null;
}

export function getLinkInfo(el: HTMLElement): IExtractedLinkInfo | null {
    const raw = el.dataset.raw;
    if (!raw)
        return null;

    const startStr = el.dataset.start;
    const endStr = el.dataset.end;
    const range = startStr != null && endStr != null
        ? { start: Number(startStr), end: Number(endStr) }
        : null;

    return {
        href: readHref(el),
        raw,
        text: el.textContent ?? '',
        range,
    };
}
