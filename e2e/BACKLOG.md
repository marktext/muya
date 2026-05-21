# muya-e2e BACKLOG (4-phase Roadmap)

| Phase | Theme | Tests | CI delta | Status |
| --- | --- | --- | --- | --- |
| 1 | P0 smoke + key interaction skeleton (infra) | 28 (1 fixme) | ~3-4 min | ✅ landed |
| 2 | Cross-browser matrix + drag/IME | +20 → 48 | +4-6 min | ⏳ pending |
| 3 | Render depth + remaining blocks + security | +23 → 78 (1 fixme) | +2-3 min | ✅ landed |
| 4 | Stability / performance / a11y guardrails | +28 → 106 | +3-5 min | ✅ landed |

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

- [x] Loop `setContent` / `locale()` / `destroy()` + `new Muya()` 50× → assert `EventCenter` listener count stays bounded. → `e2e/tests/stability/listener-leak.spec.ts`. Asserts on `eventCenter.events.length` (DOM listener array, NOT a Map as the original brief described) and `eventCenter.listeners` (custom pub/sub) — both stay within ±5 across 49 rebuild cycles.
- [ ] Snapshot `MutationObserver` count and listeners on `domNode`. → deferred. muya doesn't currently expose any `MutationObserver` registration through the public API; would require an internal hook.

### Performance smoke

- [x] Construct 10 000-paragraph markdown → time `setContent`. → `e2e/tests/stability/perf.spec.ts`. Budget is currently 60 s (not the 5 s target the brief asked for) — local Chromium against the Vite dev server lands in ~20 s; the muya render path runs synchronous per-block. Phase 5 should tighten this against a production bundle.
- [x] Scroll to bottom — last paragraph visible within 5 s.

### Accessibility

- [x] Add `@axe-core/playwright` devDep.
- [x] Scan the host page after init (clean state).
- [x] Scan with each floating plugin shown (IFT, slash, link tools, image tools, table tools). PreviewToolBar covered in Phase 3.
- [x] Fail on any `critical` violation. → `.exclude(['.tools'])` keeps test-harness toolbar markup out of the scan (it's unlabeled `<select>`/`<button>` only used by tests; not part of muya's a11y surface).

### Option matrix

- [x] `autoPairBracket` / `autoPairMarkdownSyntax` / `autoPairQuote` — full on/off matrix × representative input sequences. → `e2e/tests/options/autopair.spec.ts`.
- [x] `focusMode: true` — option round-trips. → `e2e/tests/options/focus-mode.spec.ts`. **Caveat:** `focusMode` is currently a no-op in the implementation: the option flag and `MU_FOCUS_MODE` class name exist, but no render path applies the class. The spec asserts the option survives the constructor and the editor still functions; once a render path lands, tighten the spec to assert the marker class.
- [x] `spellcheckEnabled` — assert `spellcheck` attribute reflects. → `e2e/tests/options/spellcheck.spec.ts`.
- [x] `disableHtml` — assert raw HTML stays unrendered. → `e2e/tests/options/disable-html.spec.ts`.

### Edge inputs

- [x] Empty document (`setContent('')`) — cursor placement, no crash.
- [x] Single-character document — cursor at index 0/1 correct.
- [x] 10× rapid setContent without awaits — final state matches the last call.

### MarkdownToHtml static export

- [x] Static export shape: heading, list, code-block, KaTeX class, mermaid container.
- [x] Script-injection sanitised away by DOMPurify (no `<script>` survives `generate()`, mounting the output into the DOM does not execute the injected script).

### Phase 4 follow-ups → Phase 5 idea bank

- **a11y violations.** axe-core surfaced these non-critical findings during Phase 4 (logged in CI). Triage and either fix or document as known accepted: `landmark-one-main` (moderate), `region` (moderate), `scrollable-region-focusable` (serious), `page-has-heading-one` (moderate), `color-contrast` (serious, slash menu). The Phase 4 a11y bar is critical-only; Phase 5 should tighten to `serious+`.
- **a11y of host test-harness toolbar.** `e2e/host/index.html`'s `.tools` block has unlabeled form controls (`<select id="language-select">` etc.) — excluded from axe scans in Phase 4. Add labels so we can drop the exclusion.
- **Perf against production bundle.** Phase 4 perf spec runs against the Vite dev server (unbundled, no minification). 10k-paragraph `setContent` budget is 60s; against a production bundle the target should be the brief's original 5s. Wire a `vite build` + preview server option to e2e/ for a dedicated `@perf` lane.
- **focusMode render path.** Surface `MU_FOCUS_MODE` class on the editor root when `focusMode: true`, then tighten `e2e/tests/options/focus-mode.spec.ts` to assert the visual marker.
- **MutationObserver leak guard.** Extend the listener-leak spec to also count `MutationObserver` registrations once muya exposes that surface.

---

## Phase 5 (out of scope; idea bank)

- nightly `schedule: cron` running the full matrix; PR runs a `@smoke`-tagged subset only
- visual regression via `expect(page).toHaveScreenshot(...)` for key float-positioning scenarios
- collaboration / OT transport simulation (muya emits ot-json1 ops on `json-change` but ships no transport)
