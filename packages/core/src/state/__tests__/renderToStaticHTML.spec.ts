// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';
import { renderToStaticHTML } from '../renderToStaticHTML';

// `renderToStaticHTML` is the synchronous markdown -> HTML public API used by
// the CommonMark / GFM spec runners. It must:
//   1. Return a string synchronously (no async; spec runner uses `it.each`).
//   2. Sanitize via DOMPurify so XSS payloads are stripped.
//   3. Render mermaid / vega-lite / plantuml code blocks as inert placeholders
//      (`<pre class="mermaid">{escapedCode}</pre>` etc.) rather than running
//      diagram renderers.
//   4. Forward the same per-render option surface as `getHighlightHtml`
//      (footnote / math / superSubScript / isGitlabCompatibilityEnabled /
//      frontMatter).
//
// `MarkdownToHtml` (the existing class) already produces wrapped HTML, but its
// `renderHtml()` path is async (awaits mermaid + diagram renderers) and wraps
// the result in `<article class="markdown-body">`. Spec runners need the bare
// inner HTML; hence a separate, sync API.

describe('renderToStaticHTML', () => {
    it('renders a simple paragraph synchronously', () => {
        const html = renderToStaticHTML('Hello, world!');
        expect(html).toContain('<p>Hello, world!</p>');
    });

    it('renders headings with id-less <hN>', () => {
        const html = renderToStaticHTML('# Heading 1\n\n## Heading 2');
        expect(html).toContain('<h1>Heading 1</h1>');
        expect(html).toContain('<h2>Heading 2</h2>');
    });

    it('renders bullet and ordered lists', () => {
        const bullet = renderToStaticHTML('- a\n- b');
        expect(bullet).toContain('<ul>');
        expect(bullet).toContain('<li>a</li>');
        expect(bullet).toContain('<li>b</li>');

        const ordered = renderToStaticHTML('1. one\n2. two');
        expect(ordered).toContain('<ol>');
        expect(ordered).toContain('<li>one</li>');
        expect(ordered).toContain('<li>two</li>');
    });

    it('renders fenced code blocks with language class', () => {
        const html = renderToStaticHTML('```js\nconsole.log(1);\n```');
        expect(html).toContain('<pre>');
        expect(html).toContain('language-js');
        expect(html).toContain('console');
    });

    it('renders mermaid code blocks as inert <pre><code> placeholders', () => {
        const html = renderToStaticHTML(
            '```mermaid\ngraph LR; A-->B\n```',
        );
        // Mermaid renderer must not be invoked synchronously; the output
        // should remain a static `<pre><code class="language-mermaid">` with
        // the mermaid source as plain text (escaped, not parsed as HTML).
        expect(html).toMatch(/class="[^"]*language-mermaid[^"]*"/);
        expect(html).toContain('graph LR');
        // Sanity: the dangerous angle brackets in the source are escaped.
        expect(html).not.toContain('<graph');
        // No mermaid SVG must appear (renderer not invoked).
        expect(html).not.toMatch(/<svg[^>]*aria-roledescription="flowchart/);
    });

    it('renders vega-lite and plantuml code blocks as inert placeholders', () => {
        const vega = renderToStaticHTML(
            '```vega-lite\n{"mark":"bar"}\n```',
        );
        expect(vega).toMatch(/class="[^"]*language-vega-lite[^"]*"/);

        const puml = renderToStaticHTML(
            '```plantuml\n@startuml\nA -> B\n@enduml\n```',
        );
        expect(puml).toMatch(/class="[^"]*language-plantuml[^"]*"/);
    });

    it('strips inline event-handler attributes via DOMPurify', () => {
        const html = renderToStaticHTML(
            '<a href="x" onclick="alert(1)">x</a>',
        );
        expect(html).not.toContain('onclick');
        expect(html).not.toContain('alert(1)');
    });

    it('strips <script> tags via DOMPurify', () => {
        const html = renderToStaticHTML(
            'before\n\n<script>alert(1)</script>\n\nafter',
        );
        expect(html).not.toMatch(/<script/i);
        expect(html).toContain('before');
        expect(html).toContain('after');
    });

    it('returns the bare body HTML (no <article> wrapper)', () => {
        // `MarkdownToHtml.renderHtml` wraps the output in
        // `<article class="markdown-body">`; renderToStaticHTML must NOT,
        // because the spec runner compares raw block-level HTML.
        const html = renderToStaticHTML('paragraph');
        expect(html).not.toMatch(/<article[^>]*class="markdown-body"/);
    });

    it('honours footnote option (off by default)', () => {
        const off = renderToStaticHTML(
            'See [^1].\n\n[^1]: footnote body',
        );
        // With footnote disabled, `[^1]` stays as literal text and the
        // definition is not rendered as a footnote section.
        expect(off).not.toMatch(/class="[^"]*footnote/);

        const on = renderToStaticHTML(
            'See [^1].\n\n[^1]: footnote body',
            { footnote: true },
        );
        // Tolerant check: any footnote-related markup should be present.
        expect(on).toMatch(/footnote|fn-/i);
    });

    it('honours math option', () => {
        const html = renderToStaticHTML('$$\nx^2\n$$', { math: true });
        // Math block should be transformed away from a literal `$$` fence.
        // KaTeX output contains class="katex" wrappers when math enabled.
        expect(html).toMatch(/katex|<math/i);
    });

    it('returns a string for empty input', () => {
        expect(renderToStaticHTML('')).toBe('');
    });
});
