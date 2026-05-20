# Changelog

# [0.2.0] (2026-05-21)

The marktext-muya backport batch. 22 PRs (#208–#230) brought the upstream marktext muya tree onto `@muyajs/core` end-to-end, with full test coverage on every change.

### Features

* footnote complete — block class + UI tool + click wiring + HTML backref ([#221](https://github.com/marktext/muya/pull/221))
* reference link/image — markdown loading + round-trip + image domsrc ([#229](https://github.com/marktext/muya/pull/229))
* `LinkTools` dispatch for `<a>`, reference link, markdown link ([#226](https://github.com/marktext/muya/pull/226))
* `muya.getTOC()` public API ([#228](https://github.com/marktext/muya/pull/228))
* `focus` / `blur` events + format cursor jump-to-end after applying bold/italic/etc. ([#225](https://github.com/marktext/muya/pull/225))
* code block line numbers (`codeBlockLineNumbers` editor option) ([#219](https://github.com/marktext/muya/pull/219))
* image small-image class + inline resize-bar suppression ([#224](https://github.com/marktext/muya/pull/224))
* CommonMark 0.31 + GFM 0.29-gfm spec conformance infrastructure ([#218](https://github.com/marktext/muya/pull/218))
* backport marktext muya parser test suites ([#220](https://github.com/marktext/muya/pull/220))

### Bug Fixes

* P0 crashes — `normalizeTable` row count, `loadImageAsync` failed cache ([#208](https://github.com/marktext/muya/pull/208))
* XSS protections — `langInputContent`, hyperlinks, Mermaid, code block ([#209](https://github.com/marktext/muya/pull/209))
* parser CommonMark/GFM correctness + regression baseline ([#212](https://github.com/marktext/muya/pull/212))
* `stateToMarkdown` serialization baseline ([#213](https://github.com/marktext/muya/pull/213))
* defensive inline regressions for bold+code, parens-in-dest ([#214](https://github.com/marktext/muya/pull/214))
* backport marktext muya editor/cursor/IME/autopair/table fixes ([#211](https://github.com/marktext/muya/pull/211))
* clipboard / paste / copy correctness ([#210](https://github.com/marktext/muya/pull/210), [#215](https://github.com/marktext/muya/pull/215), [#216](https://github.com/marktext/muya/pull/216), [#217](https://github.com/marktext/muya/pull/217))
* `EventCenter` listener leak + once-listener iteration mutation ([#230](https://github.com/marktext/muya/pull/230))

### Internal

* test coverage 1 → 386 tests (43 files)
* conformance baseline locked at CommonMark 87.7% / GFM 86.3%; regression-gated by `expected-failures.json`
* residuals cleanup — XSS assessment + post-refactor split + skipped tags ([#223](https://github.com/marktext/muya/pull/223), [#227](https://github.com/marktext/muya/pull/227))

# [0.1.0](https://github.com/marktext/muya/compare/v0.0.39...v0.1.0) (2026-05-20)


### Bug Fixes

* avoid shared Marked state leaking across renderHtml calls ([#202](https://github.com/marktext/muya/issues/202)) ([a1caa67](https://github.com/marktext/muya/commit/a1caa6782d9f8d7d5c5232528641852a9fe34925))
* **build:** restore lib/types output after vite-plugin-dts v5 upgrade ([6da5a21](https://github.com/marktext/muya/commit/6da5a21641f337f427c36dce6255ccd6622e6306))

## [0.0.39](https://github.com/marktext/muya/compare/v0.0.38...v0.0.39) (2025-11-17)


### Bug Fixes

* ResizeObserver loop completed with undelivered notifications. ([58e4789](https://github.com/marktext/muya/commit/58e4789becbb0edda79d96fd483340dd58faaa82))

## [0.0.38](https://github.com/marktext/muya/compare/v0.0.37...v0.0.38) (2025-11-17)


### Bug Fixes

* hide inline format toolbar when necessary ([c515b7f](https://github.com/marktext/muya/commit/c515b7f6f30e2f520032c355f09f3a037f9b8294))

## [0.0.37](https://github.com/marktext/muya/compare/v0.0.36...v0.0.37) (2025-11-13)


### Bug Fixes

* list style css ([8785f21](https://github.com/marktext/muya/commit/8785f21c75917eaf0899298a5aae7edbadf5c3f5))

## [0.0.36](https://github.com/marktext/muya/compare/v0.0.35...v0.0.36) (2025-11-13)


### Features

* update list style ([c2f7cb8](https://github.com/marktext/muya/commit/c2f7cb8f17ae65c166652bbd5565c2afd5b9bf8a))

## [0.0.35](https://github.com/marktext/muya/compare/v0.0.34...v0.0.35) (2025-11-06)


### Bug Fixes

* TS error in table picker ([ab1f81f](https://github.com/marktext/muya/commit/ab1f81f57b1ce9e3e5c66ab8c7d2d42c1d78f3cd))

## [0.0.34](https://github.com/marktext/muya/compare/v0.0.33...v0.0.34) (2025-11-06)


### Bug Fixes

* some lint error ([f6af8e0](https://github.com/marktext/muya/commit/f6af8e04ae7531f55e2dff378b281049d8e83fbf))

## [0.0.33](https://github.com/marktext/muya/compare/v0.0.32...v0.0.33) (2025-10-28)


### Bug Fixes

* undo error when input slash ([#172](https://github.com/marktext/muya/issues/172)) ([5f3cbbb](https://github.com/marktext/muya/commit/5f3cbbbcbab79be8d3d7ad9a02035f0e1ae25480))
* update @muya/core to @muyajs/core in examples ([055d04d](https://github.com/marktext/muya/commit/055d04da4f34c9ff8784f00c207b3504d44d06d4))

# CHANGELOG
