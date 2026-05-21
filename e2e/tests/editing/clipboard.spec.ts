import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures/muya';
import { getMarkdown } from '../helpers/api';
import { editor } from '../helpers/selectors';

/**
 * Real-HTML clipboard paste, driven via a synthetic `ClipboardEvent`
 * whose `clipboardData` is a populated `DataTransfer`. Chromium honours
 * `new ClipboardEvent('paste', { clipboardData })` — the constructed
 * event reaches the editor's paste listener with the supplied
 * clipboardData. Firefox silently nulls `clipboardData` on synthetic
 * ClipboardEvents (bug 1456493, still open), and WebKit denies
 * cross-origin clipboard reads in headless mode; both engines are
 * therefore skipped at the describe level and tracked in BACKLOG
 * Phase 3 (real paste via CDP / keyboard-driven Cmd+V).
 *
 * Why dispatch + DataTransfer instead of `keyboard.press('Cmd+V')`?
 * On headless Chromium the OS clipboard is empty and the keystroke
 * fires a paste with `clipboardData: null`. Synthetic dispatch keeps
 * the test self-contained — the editor sees the same paste-handler
 * code path that real users hit (no fork inside `pasteHandler`).
 */
async function pasteHtml(page: Page, html: string, text = ''): Promise<void> {
    await page.evaluate(({ html, text }) => {
        const dt = new DataTransfer();
        dt.setData('text/html', html);
        if (text)
            dt.setData('text/plain', text);
        const muyaDomNode = window.muya!.domNode;
        const evt = new ClipboardEvent('paste', {
            bubbles: true,
            cancelable: true,
            clipboardData: dt,
        });
        muyaDomNode.dispatchEvent(evt);
    }, { html, text });
}

async function pastePlain(page: Page, text: string): Promise<void> {
    await page.evaluate((text) => {
        const dt = new DataTransfer();
        dt.setData('text/plain', text);
        const muyaDomNode = window.muya!.domNode;
        const evt = new ClipboardEvent('paste', {
            bubbles: true,
            cancelable: true,
            clipboardData: dt,
        });
        muyaDomNode.dispatchEvent(evt);
    }, text);
}

test.describe('clipboard paste', () => {
    // Restrict synthetic-DataTransfer paste tests to Chromium. The
    // "wired" sanity test runs on every engine — see the
    // `test.skip(...)` inside it.
    test('clipboard module is wired (sanity-check via internal handle)', async ({ page }) => {
        await page.evaluate(() => window.muya!.setContent(''));
        // The clipboard module attaches a `paste` listener to the editor
        // domNode at init; assert the module is present and the editor is
        // ready to receive real paste events.
        const wired = await page.evaluate(() => !!window.muya!.editor.clipboard);
        expect(wired).toBe(true);
        await expect(page.locator(editor.container)).toBeVisible();
    });

    test('pasting <b>foo</b> converts to **foo**', async ({ browserName, page }) => {
        test.skip(browserName !== 'chromium', 'Synthetic ClipboardEvent.clipboardData unsupported on Firefox/WebKit — BACKLOG Phase 3.');
        await page.evaluate(() => window.muya!.setContent(''));
        await page.locator(editor.paragraph).first().click();
        await pasteHtml(page, '<b>foo</b>', 'foo');

        await expect.poll(async () => getMarkdown(page), {
            timeout: 5_000,
            intervals: [50, 100, 250, 500],
        }).toMatch(/\*\*foo\*\*/);
    });

    test('pasting <a href> converts to markdown link', async ({ browserName, page }) => {
        test.skip(browserName !== 'chromium', 'Synthetic ClipboardEvent.clipboardData unsupported on Firefox/WebKit — BACKLOG Phase 3.');
        await page.evaluate(() => window.muya!.setContent(''));
        await page.locator(editor.paragraph).first().click();
        await pasteHtml(page, '<a href="https://example.test/">click here</a>', 'click here');

        await expect.poll(async () => getMarkdown(page), {
            timeout: 5_000,
            intervals: [50, 100, 250, 500],
        }).toMatch(/\[click here\]\(https:\/\/example\.test\/?\)/);
    });

    test('pasting a basic <table> converts to a GFM table', async ({ browserName, page }) => {
        test.skip(browserName !== 'chromium', 'Synthetic ClipboardEvent.clipboardData unsupported on Firefox/WebKit — BACKLOG Phase 3.');
        await page.evaluate(() => window.muya!.setContent(''));
        await page.locator(editor.paragraph).first().click();
        const html = '<table><thead><tr><th>h1</th><th>h2</th></tr></thead>'
            + '<tbody><tr><td>r1c1</td><td>r1c2</td></tr></tbody></table>';
        await pasteHtml(page, html, 'h1\th2\nr1c1\tr1c2');

        await expect.poll(async () => getMarkdown(page), {
            timeout: 5_000,
            intervals: [50, 100, 250, 500],
        }).toMatch(/\|\s*h1\s*\|\s*h2\s*\|/);

        const md = await getMarkdown(page);
        // GFM separator row + body row.
        expect(md).toMatch(/\|\s*-+\s*\|\s*-+\s*\|/);
        expect(md).toMatch(/\|\s*r1c1\s*\|\s*r1c2\s*\|/);
    });

    test('pasting plain text without HTML falls back to text insertion', async ({ browserName, page }) => {
        test.skip(browserName !== 'chromium', 'Synthetic ClipboardEvent.clipboardData unsupported on Firefox/WebKit — BACKLOG Phase 3.');
        await page.evaluate(() => window.muya!.setContent(''));
        await page.locator(editor.paragraph).first().click();
        await pastePlain(page, 'just plain text');

        await expect.poll(async () => getMarkdown(page), {
            timeout: 5_000,
            intervals: [50, 100, 250, 500],
        }).toContain('just plain text');

        // Plain-text paste does NOT introduce markdown delimiters — the
        // body is plain prose, no `**`, no `[…](…)`, no `|`.
        const md = await getMarkdown(page);
        expect(md).not.toMatch(/[*_`|[\]]/);
    });
});
