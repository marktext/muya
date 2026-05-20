import { EXPORT_DOMPURIFY_CONFIG } from '../config';
import { sanitize } from '../utils';
import { getHighlightHtml } from '../utils/marked';

export interface IRenderToStaticHTMLOptions {
    footnote?: boolean;
    math?: boolean;
    isGitlabCompatibilityEnabled?: boolean;
    superSubScript?: boolean;
    frontMatter?: boolean;
    /**
     * Skip DOMPurify sanitization. **Unsafe with untrusted input** — drops
     * the XSS guarantees of the default export path. Only intended for
     * CommonMark / GFM spec compliance runners, which need to compare
     * against the parser's raw output (the spec includes "raw HTML
     * allowance" examples that DOMPurify would otherwise rewrite).
     *
     * @default true
     */
    sanitize?: boolean;
}

/**
 * Synchronous markdown → HTML renderer used by the CommonMark / GFM spec
 * conformance runners and by any consumer that wants a Promise-free render.
 *
 * Differences from `MarkdownToHtml`:
 *  - Synchronous: no mermaid / vega-lite / plantuml diagram rendering. Diagram
 *    code blocks remain inert `<pre><code class="language-*">…</code></pre>`
 *    placeholders. Consumers that want live diagrams should keep using the
 *    async `MarkdownToHtml`.
 *  - Returns the bare body HTML — no `<article class="markdown-body">` wrapper,
 *    no `<!DOCTYPE>` / `<head>` / styles. The spec runner compares raw block
 *    HTML against CommonMark / GFM expected output.
 *  - Sanitizes via the same `EXPORT_DOMPURIFY_CONFIG` as `MarkdownToHtml`, so
 *    XSS payloads (script tags, event-handler attributes, `javascript:` URLs)
 *    are stripped consistently with the live editor's export path.
 *
 * Empty input fast-paths to an empty string so callers don't have to special
 * case it.
 */
export function renderToStaticHTML(
    markdown: string,
    options: IRenderToStaticHTMLOptions = {},
): string {
    if (!markdown)
        return '';

    const html = getHighlightHtml(markdown, {
        footnote: options.footnote ?? false,
        math: options.math ?? true,
        isGitlabCompatibilityEnabled: options.isGitlabCompatibilityEnabled ?? true,
        superSubScript: options.superSubScript ?? true,
        frontMatter: options.frontMatter ?? false,
    });

    if (options.sanitize === false)
        return html;

    return sanitize(html, EXPORT_DOMPURIFY_CONFIG, false) as string;
}
