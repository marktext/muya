# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

pnpm + Turborepo monorepo. Workspaces are defined in `pnpm-workspace.yaml`:

- `packages/core` — `@muyajs/core`, the only package with source today. Everything below describes it.
- `packages/facade`, `packages/findReplace` — README-only stubs (no source yet).
- `examples` — `muya-examples`, a Vite vanilla-TS demo that consumes `@muyajs/core` via `workspace:*`. This is the dev surface (`pnpm dev` runs `vite` here through `turbo dev:demo`).

## Commands

Run from repo root (Turbo fans out to packages):

- `pnpm dev` — start the examples Vite dev server (`turbo dev:demo`, persistent task).
- `pnpm build` — `tsc && vite build` in `packages/core`, emits `lib/{es,umd,cjs}` and `lib/types`.
- `pnpm test` / `pnpm coverage` — Vitest (`--passWithNoTests`). For a single test in core: `pnpm --filter @muyajs/core exec vitest run path/to/file.test.ts` or `pnpm --filter @muyajs/core test:watch`.
- `pnpm --filter @muyajs/core test:spec` — run the CommonMark 0.31 + GFM 0.29-gfm fixture suites against `renderToStaticHTML(..., { sanitize: false })`. `test:spec:commonmark` / `test:spec:gfm` scope to one suite. Pass/fail counts are locked by `packages/core/test/spec/expected-failures.json`: any listed example that starts passing fails the suite (remove it from the list), and any unlisted example that starts failing fails the suite. Net effect: compliance can only go up. Baseline lives in `packages/core/test/spec/conformance.md` (CommonMark 87.7% / GFM 86.3% at PR-6a).
- `pnpm lint` / `pnpm lint:fix` — ESLint over `packages` (antfu config, see below for project-specific rules).
- `pnpm lint:types` — `tsc --noEmit` per package via Turbo.
- `pnpm lint:css` — Stylelint over all CSS.
- `pnpm check-circular` — `madge --circular packages/core/src/index.ts`. CI enforces this; do not introduce circular deps.
- `pnpm release <version>` — `release-it` cuts a release end-to-end: bumps versions in root + workspace `package.json`s, prepends a section to `CHANGELOG.md` (angular conventional-changelog preset), commits, tags, pushes, and runs `pnpm publish` on `packages/core` via `@release-it-plugins/workspaces` (`publish: true`). npm 2FA is interactive — a browser auth window opens during the publish step.

Engines: Node ≥18 for the lib, **Node ≥20.19, ≥22.13, or ≥24 for releases** (`@release-it/conventional-changelog@11` declares `node: ^20.19.0 || ^22.13.0 || >=24.0.0`, so older 20.x / early 22.x will fail). pnpm ≥8.5 (pinned to `pnpm@10.22.0`). Build target is `chrome70`.

## Architecture

### Entry point and plugin system

`packages/core/src/muya.ts` exports the `Muya` class. UI plugins are registered globally via the static `Muya.use(Plugin, options)` and instantiated inside `muya.init()`. Plugins are keyed by `Plugin.pluginName` and stored on `muya._uiPlugins`. The plugin set in `examples/src/main.ts` is the canonical reference for wiring up toolbars, selectors, and menus.

`new Muya(element, options)` replaces the passed-in element with a new `contenteditable` div (`getContainer` in `muya.ts`), then constructs `EventCenter`, `Editor`, `Ui`, and `I18n`. Nothing renders until `muya.init()` runs `Editor.init()`, which calls `registerBlocks()` and creates the root `ScrollPage`.

### The `Editor` (`src/editor/index.ts`)

Holds the runtime modules: `JSONState`, `InlineRenderer`, `Selection`, `Search`, `Clipboard`, `History`, and the root `ScrollPage`. It owns `activeContentBlock` (the focused leaf) and routes DOM events (`click`, `input`, `keydown`, `keyup`, `compositionstart/end`) merged via RxJS to the active block's handlers (`clickHandler`, `inputHandler`, etc.). Anything that listens to user input on a block ultimately flows through this dispatch.

`Editor.updateContents(operations, selection, source)` applies `ot-json1` operations to the live block tree. The `pick`/`drop` walk is hand-rolled from `ot-json1.apply` so it can call `block.replaceWith`, `container.insertBefore`, `ScrollPage.loadBlock(name).create(...)`, and `otText.type.apply` on the matching subdocument — the block tree and the JSON state stay in lockstep.

### Block tree

All blocks extend `TreeNode → Parent → (Content | Format)` in `src/block/base/`. `Parent` owns a `LinkedList` of `children` plus an `attachments` list for non-state nodes (icons, checkboxes). `Content` is the leaf that owns the actual text; `Format` extends `Content` with inline-format handling.

Concrete blocks live under `src/block/{commonMark,gfm,extra,content}` and **must be registered** in `src/block/index.ts::registerBlocks()`, which `Editor.init()` calls before constructing the root `ScrollPage`. `ScrollPage` (in `src/block/scrollPage/index.ts`) keeps a static `registeredBlocks` map; lookups go through `ScrollPage.loadBlock(blockName).create(muya, state)`. **Add a new block type → register it here, otherwise `loadBlock` will warn and return undefined.**

`block/mixins/{containerQueryBlock,leafQueryBlock}.ts` are constructor mixins applied to block classes for `queryBlock`/path resolution (the ROADMAP notes this was a deliberate switch away from property mixins).

### State and markdown round-trip (`src/state/`)

- `JSONState` (`state/index.ts`) is the source-of-truth document. It exposes `ot-json1` `invert`/`compose`/`transform` statics — the architecture is set up for OT-based collaborative editing even if no transport is wired in.
- `markdownToState.ts` parses Markdown (via `marked`) into the state tree; `stateToMarkdown.ts` serializes back; `markdownToHtml.ts` and `htmlToMarkdown.ts` (using `turndown` + `joplin-turndown-plugin-gfm`) bridge HTML. `MarkdownToHtml` is re-exported from the public API.
- Inline text edits are encoded as `ot-text-unicode` ops nested inside the json1 ops (see the `d.es` branch in `Editor.updateContents`).
- **Reference link/image definitions** (`[ref]: url "title"`) are NOT a first-class block type in state. `markdownToState`'s `case 'def'` re-emits the raw definition line back into a `paragraph` state node so it round-trips losslessly through the markdown serializer. `InlineRenderer.collectReferenceDefinitions()` runs over the live block tree on every render pass to populate a labels Map that the lexer consults when expanding `[text][ref]` and `![alt][ref]`. `ILinkReferenceDefinitionState` exists as a deprecated stub for compatibility — do not introduce new code paths that produce it.
- **TOC** is derived on-demand via `getTOC(muya)` (`state/getTOC.ts`); the public method is `muya.getTOC()` (`packages/core/src/muya.ts`). Slugs follow the marktext-compatible regex carried over in commit `9cb2cbe8`.

### Inline rendering and DOM

`src/inlineRenderer/` tokenizes inline content with a custom `lexer`/`rules` pipeline and renders to a virtual DOM via `snabbdom` (and `snabbdom-to-html` for serialization). KaTeX, Prism, Mermaid, Vega/Vega-Lite, and PlantUML are integrated for math, code highlighting, and diagrams.

### UI layer (`src/ui/`)

Each subfolder is a floating tool/menu (inline format toolbar, image tools, paragraph front button, table tools, emoji selector, etc.) extending `baseFloat` or `baseScrollFloat` and positioned with `@floating-ui/dom`. They're imported and re-exported from `src/index.ts` and registered by consumers via `Muya.use(...)`. `Ui` (`src/ui/ui.ts`) is the registry the editor talks to.

### Public API surface

`packages/core/src/index.ts` is the published entrypoint. The `exports` map in `package.json` points `.` at `./src/index.ts` during development and `./lib/es/index.js` after publish — keep this file the single export hub.

## Conventions enforced by tooling

- **Conventional Commits** are required (`.commitlintrc.cjs`, husky `commit-msg`). Allowed types: `build, ci, chore, docs, feat, fix, perf, refactor, revert, style, test`.
- **lint-staged** (`.lintstagedrc`) runs `eslint --fix` on `*.ts` and `stylelint --fix` on `*.{html,css}` pre-commit.
- **ESLint** (`eslint.config.mjs`, antfu base) adds:
    - `complexity` ≤ 20 and `max-lines-per-function` ≤ 200 (warnings) for non-test TS.
    - Interface names **must** start with `I[A-Z0-9]` (e.g. `IMuyaOptions`, `IPlugin`). The naming-convention rule will flag interfaces that don't.
    - Private class members **must** be prefixed with `_` (e.g. `_uiPlugins`, `_activeContentBlock`).
    - Style: 4-space indent, semicolons required, React rules disabled, Markdown linting disabled.
- **Madge** circular-dep check (`pnpm check-circular`) runs in CI — adding a circular import will fail the build.
- Test files (`*.test.ts`, `*.spec.ts`) and `vite.config.ts` are excluded from the strict TS lint rules above.

## Release pipeline

A few non-obvious wiring details around `pnpm release`:

- **`.release-it.json`** keeps the top-level `npm: false` (root package is `private: true`) and offloads publishing to `@release-it-plugins/workspaces` with `publish: true`. The workspaces glob is `packages/*`; sibling stubs without a `package.json` (`packages/facade`, `packages/findReplace`) are silently skipped.
- **Conventional-changelog preset** is configured as `{ "name": "angular" }` (object form required by `@release-it/conventional-changelog@11`); the string shorthand fails. `conventional-changelog-angular` is pinned as a root devDependency so the ESM preset loader can resolve it under pnpm’s isolated layout — don’t drop it.
- **GitHub release** is created out-of-band with `gh release create` (`github.release` is `false` in the config), so the release does not require `GITHUB_TOKEN`. Extract the new section from `CHANGELOG.md` with `awk` and pass `--notes-file`.
- **Recovering from a half-failed run**: if `pnpm release` succeeds through `git push` but the npm upload errors (EPIPE, OTP timeout, network), the version bump and tag are already on origin. Retry just the upload with `pnpm --filter @muyajs/core publish --tag latest --access public --no-git-checks`. Do NOT re-run `pnpm release` — it would try to bump the version again.
- **`vite-plugin-dts@5`** (transitive via `unplugin-dts`) uses `outDirs` (plural), not `outDir`. `packages/core/vite.config.ts` relies on this to emit declarations into `lib/types/`, which is the path `packages/core/package.json`'s `publishConfig.exports[*].types` points to. If you ever see `lib/index.d.ts` appearing directly under `lib/`, the option name has regressed.
