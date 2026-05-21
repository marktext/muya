import type { IMuyaOptions } from '@muyajs/core';
import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures/muya';
import { getMarkdown } from '../helpers/api';
import { editor } from '../helpers/selectors';

/**
 * Auto-pair option matrix.
 *
 * Behaviour we exercise (from `packages/core/src/block/base/content.ts`):
 *   - `autoPairBracket`     — typing `(`, `[`, `{` inserts the matching close
 *     when the cursor is at end-of-line or before whitespace.
 *   - `autoPairMarkdownSyntax` — typing `*`, `_`, `` ` ``, `$`, `~` pairs the marker.
 *   - `autoPairQuote`       — typing `"` (or `'` after non-word) pairs the quote.
 *
 * For each (option-on, option-off) variant we rebuild Muya via the host
 * helper `window.__e2e.rebuildMuya(...)` so the constructor option is
 * actually consumed (the option is read inside autoPair from
 * `this.muya.options`, captured at constructor time).
 */

/**
 * Rebuild Muya with the given options, then click into a fresh
 * paragraph and wait for the editor to register the click — only after
 * `activeContentBlock` is non-null is it safe to fire keyboard input.
 * Without this sync barrier the test is flaky on parallel CI runs
 * because the click can race with the editor's mount.
 */
async function rebuildAndFocus(page: Page, opts: Partial<IMuyaOptions>): Promise<void> {
    await page.evaluate((o) => {
        window.__e2e!.rebuildMuya(o);
        window.muya!.setContent('');
    }, opts);
    const paragraph = page.locator(editor.paragraph).first();
    await expect(paragraph).toBeVisible();
    await paragraph.click();
    await page.waitForFunction(() => window.muya!.editor.activeContentBlock != null);
}

async function getFirstBlockText(page: Page): Promise<string> {
    return page.evaluate(() => {
        const state = window.muya!.getState() as Array<{ text?: string }>;
        return state[0]?.text ?? '';
    });
}

test.describe('options / auto-pair matrix', () => {
    test('autoPairBracket: on → `(` produces `()`', async ({ page }) => {
        await rebuildAndFocus(page, {
            autoPairBracket: true,
            autoPairMarkdownSyntax: false,
            autoPairQuote: false,
        });
        await page.keyboard.type('(');
        await expect(page.locator(editor.paragraph).first()).toContainText('()');
        const md = await getMarkdown(page);
        expect(md).toContain('()');
    });

    test('autoPairBracket: off → `(` produces `(` only', async ({ page }) => {
        await rebuildAndFocus(page, {
            autoPairBracket: false,
            autoPairMarkdownSyntax: false,
            autoPairQuote: false,
        });
        await page.keyboard.type('(');
        await expect(page.locator(editor.paragraph).first()).toContainText('(');
        expect(await getFirstBlockText(page)).toBe('(');
    });

    test('autoPairMarkdownSyntax: on → `*` produces `**`', async ({ page }) => {
        await rebuildAndFocus(page, {
            autoPairBracket: false,
            autoPairMarkdownSyntax: true,
            autoPairQuote: false,
        });
        await page.keyboard.type('*');
        // Wait for state to reflect the paired insertion.
        await expect.poll(() => getFirstBlockText(page)).toBe('**');
    });

    test('autoPairMarkdownSyntax: off → `*` stays single', async ({ page }) => {
        await rebuildAndFocus(page, {
            autoPairBracket: false,
            autoPairMarkdownSyntax: false,
            autoPairQuote: false,
        });
        await page.keyboard.type('*');
        await expect.poll(() => getFirstBlockText(page)).toBe('*');
    });

    test('autoPairQuote: on → `"` produces `""`', async ({ page }) => {
        await rebuildAndFocus(page, {
            autoPairBracket: false,
            autoPairMarkdownSyntax: false,
            autoPairQuote: true,
        });
        await page.keyboard.type('"');
        await expect.poll(() => getFirstBlockText(page)).toBe('""');
    });

    test('autoPairQuote: off → `"` stays single', async ({ page }) => {
        await rebuildAndFocus(page, {
            autoPairBracket: false,
            autoPairMarkdownSyntax: false,
            autoPairQuote: false,
        });
        await page.keyboard.type('"');
        await expect.poll(() => getFirstBlockText(page)).toBe('"');
    });

    test('all-off combo: no pairing happens for any of `(`, `*`, `"`', async ({ page }) => {
        await rebuildAndFocus(page, {
            autoPairBracket: false,
            autoPairMarkdownSyntax: false,
            autoPairQuote: false,
        });
        await page.keyboard.type('(');
        await expect.poll(() => getFirstBlockText(page)).toBe('(');

        // Reset paragraph and re-focus for the next char.
        await page.evaluate(() => window.muya!.setContent(''));
        await page.locator(editor.paragraph).first().click();
        await page.waitForFunction(() => window.muya!.editor.activeContentBlock != null);
        await page.keyboard.type('*');
        await expect.poll(() => getFirstBlockText(page)).toBe('*');

        await page.evaluate(() => window.muya!.setContent(''));
        await page.locator(editor.paragraph).first().click();
        await page.waitForFunction(() => window.muya!.editor.activeContentBlock != null);
        await page.keyboard.type('"');
        await expect.poll(() => getFirstBlockText(page)).toBe('"');
    });
});
