import { expect, test } from '../fixtures/muya';
import { editor } from '../helpers/selectors';

test.describe('clipboard paste', () => {
    test('clipboard module is wired (sanity-check via internal handle)', async ({ page }) => {
        await page.evaluate(() => window.muya!.setContent(''));
        // The clipboard module attaches a `paste` listener to the editor
        // domNode at init; assert the module is present and the editor is
        // ready to receive real paste events. Synthetic ClipboardEvent in
        // Chromium has `event.clipboardData === null`, so end-to-end paste
        // testing requires CDP-injected clipboard contents — see BACKLOG
        // Phase 2 for the full coverage plan.
        const wired = await page.evaluate(() => !!window.muya!.editor.clipboard);
        expect(wired).toBe(true);
        await expect(page.locator(editor.container)).toBeVisible();
    });

    // Phase 2 BACKLOG item: real HTML paste via CDP injectClipboardData or
    // navigator.clipboard.write(ClipboardItem) with granted permissions.
    test.fixme('pasting HTML converts to markdown formatting', async ({ page }) => {
        await page.evaluate(() => window.muya!.setContent(''));
        // …intentionally fails until BACKLOG paste-via-CDP work lands.
        expect(false).toBe(true);
    });
});
