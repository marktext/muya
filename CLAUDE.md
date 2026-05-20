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
- `pnpm lint` / `pnpm lint:fix` — ESLint over `packages` (antfu config, see below for project-specific rules).
- `pnpm lint:types` — `tsc --noEmit` per package via Turbo.
- `pnpm lint:css` — Stylelint over all CSS.
- `pnpm check-circular` — `madge --circular packages/core/src/index.ts`. CI enforces this; do not introduce circular deps.
- `pnpm release` — `release-it` (conventional changelog + workspaces plugin). Publishing is `pnpm -r publish` after `pnpm build`.

Engines: Node ≥18, pnpm ≥8.5 (pinned to `pnpm@10.22.0`). Build target is `chrome70`.

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
