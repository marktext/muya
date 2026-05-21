# muya-e2e BACKLOG (4-phase Roadmap)

| Phase | Theme | Tests | CI delta | Status |
| --- | --- | --- | --- | --- |
| 1 | P0 smoke + key interaction skeleton (infra) | 28 (1 fixme) | ~3-4 min | ✅ landed |
| 2 | Cross-browser matrix + drag/IME | +20 → 48 | +4-6 min | ⏳ pending |
| 3 | Render depth + remaining blocks + security | +23 → 78 (1 fixme) | +2-3 min | ✅ landed |
| 4 | Stability / performance / a11y guardrails | +25 → 98 | +3-5 min | ⏳ pending |

Phase 1 baseline (PR landing snapshot):

- **54 passed, 1 skipped** (`tests/editing/clipboard.spec.ts` — `test.fixme` waiting for Phase 2 CDP clipboard wiring)
- **Local runtime ~8 s** (Chromium only, parallel workers)
- **CI target: ~3-4 min** (bundled Chromium install + tests + artifact upload)

---

## Phase 2 — Cross-browser matrix + drag / IME

Unlocks Firefox + WebKit, and the input/drag flows that don't survive cross-engine differences.

### Cross-browser

- [ ] Uncomment `firefox` + `webkit` projects in `playwright.config.ts`.
- [ ] Drop the `--project=chromium` filter from `pnpm e2e`; add `pnpm e2e:firefox` / `pnpm e2e:webkit` aliases for targeted runs.
- [ ] `ci-e2e.yml`: install all three browsers (`playwright install --with-deps`), bump runner concurrency.

### IME composition

- [ ] CJK candidate flow: `compositionstart` → multiple `input` events with `isComposing=true` → `compositionend`. Assert that `selection-change` only fires *after* `compositionend` and that the committed text lands as a single state mutation.
- [ ] CJK in lists / table cells (different parent contexts).

### Drag and drop

- [ ] **TableDragBar row/column resize.** Hover table edge → bar appears → mousedown + mousemove (delta) + mouseup → assert row height / column width changed in state meta.
- [ ] **ParagraphFrontButton block reorder.** Drag the front handle from paragraph A to position above paragraph B → assert `getMarkdown` order swapped.
- [ ] **ImageResizeBar.** Click block-aligned image → drag a corner handle → assert width meta updated.

### E2E TypeScript typecheck

- [ ] Add `lint:types` script to `e2e/package.json` (currently absent because the imported `@muyajs/core` source pulls in `__MUYA_BLOCK__` / module-augmentation globals that aren't re-declared in `e2e/types.d.ts`).
- [ ] Either re-declare the needed globals in `e2e/types.d.ts`, or include `packages/core/src/types/global.d.ts` from the e2e tsconfig.

### Real HTML clipboard

- [ ] Replace the `test.fixme` in `tests/editing/clipboard.spec.ts` with a real paste via:
  - `context.grantPermissions(['clipboard-read', 'clipboard-write'])` +
  - `navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }) })])` +
  - `keyboard.press('Cmd/Ctrl+V')`.
- [ ] Cover: paste `<b>` → `**…**`, paste `<a href>` → `[…](url)`, paste `<table>` → GFM table, paste plain text fallback.

---

## Phase 3 — Render depth + remaining blocks + security

Landed: 23 new tests across `tests/diagrams/`, `tests/blocks/`, `tests/security/`.
Local runtime ~+2s on top of Phase 1 baseline.

### Diagrams

- [x] **Vega-Lite.** Inject a Vega-Lite spec via `setContent` → wait for `.mu-diagram-preview svg` → count `path|rect` mark elements to verify the chart actually rendered. (`tests/diagrams/vega-lite.spec.ts`, 2 tests)
- [x] **PlantUML.** `@startuml…@enduml` round-trips through `setContent` + `getMarkdown`. `plantuml.com/**` is mocked via `page.route` for hermeticity; the spec asserts the encoded URL shape and `getMarkdown` preserves source. (`tests/diagrams/plantuml.spec.ts`, 2 tests)

### Remaining block types

- [x] **Frontmatter (yaml / toml / json `;;;` / json `{}`).** All four delimiter styles round-trip through `setContent` + `getMarkdown`. (`tests/blocks/frontmatter.spec.ts`, 4 tests)
- [x] **HTML inline formats.** `<u>`, `<mark>`, `<sup>`, `<sub>` each round-trip via the generic `htmlTag` renderer; `<ruby>` is split out because it routes through the dedicated `htmlRuby` renderer (mounts `span.mu-ruby` not `*.mu-raw-html`). (`tests/blocks/html-inline.spec.ts`, 5 tests)
- [x] **ReferenceLink / ReferenceImage round-trip.** Direct PR-16 regression coverage including case-insensitive label resolution. Reference images mock `example.test/**` to make `loadImage` resolve. (`tests/blocks/reference-link-image.spec.ts`, 4 tests)
- [x] **Footnote.** Multiple `[^a]` refs sharing a definition, definition appearing before vs after the first ref, and the deliberate "no auto-cleanup of orphan defs" current contract. (`tests/blocks/footnote-scenarios.spec.ts`, 3 tests)

### Sanitize / XSS

- [x] Inject `<script>(window).__pwned = true</script>` via setContent → assert `window.__pwned` never set. Canary declared on `Window` in `e2e/types.d.ts`.
- [x] Inject `<a href="javascript:alert(1)">x</a>` → assert anchor's rendered `href` is either dropped or no longer contains `javascript:`.
- [x] Inject `<img src=x onerror="…">` → assert `onerror` attribute is stripped + canary not set.
- [ ] Static export via `new MarkdownToHtml(md).generate()` against same payloads → assert sanitized HTML output. **Deferred to Phase 4** — current host doesn't expose `MarkdownToHtml` on `window`, and reaching for `page.evaluate(() => new (await import('@muyajs/core')).MarkdownToHtml(...))` would require new host plumbing. Phase 4 can wire it onto `window.__e2e` and assert the static path.

---

## Phase 4 — Stability / perf / a11y guardrails

### Listener-leak regression (PR-17 redux)

- [ ] Loop `setContent` / `locale()` / `destroy()` + `new Muya()` 50× → assert `EventCenter` listener count stays bounded.
- [ ] Snapshot `MutationObserver` count and listeners on `domNode`.

### Performance smoke

- [ ] Construct 10 000-paragraph markdown → time `setContent` (< 5s budget on CI).
- [ ] Scroll to bottom — first frame < 1 s.

### Accessibility

- [ ] Add `@axe-core/playwright` devDep.
- [ ] Scan the host page after init (clean state).
- [ ] Scan with each floating plugin shown (IFT, slash, link tools, image tools, table tools, preview toolbar).
- [ ] Fail on any `critical` violation; allow Phase 4 to start with the lowest tier (`serious+`) and tighten over time.

### Option matrix

- [ ] `autoPairBracket` / `autoPairMarkdownSyntax` / `autoPairQuote` — full on/off matrix × representative input sequences (`(text`, `**text`, `"text`).
- [ ] `focusMode: true` — toggle active paragraph, assert visual distinction.
- [ ] `spellcheckEnabled` — assert `spellcheck` attribute reflects.
- [ ] `disableHtml` — assert raw HTML stays unrendered.

### Edge inputs

- [ ] Empty document (`setContent('')`) — cursor placement, no crash.
- [ ] Single-character document — cursor at index 0/1 correct.

---

## Phase 5 (out of scope; idea bank)

- nightly `schedule: cron` running the full matrix; PR runs a `@smoke`-tagged subset only
- visual regression via `expect(page).toHaveScreenshot(...)` for key float-positioning scenarios
- collaboration / OT transport simulation (muya emits ot-json1 ops on `json-change` but ships no transport)
