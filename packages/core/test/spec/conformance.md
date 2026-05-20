# CommonMark / GFM spec conformance

Baseline captured at PR-6a (2026-05-20).

Re-run via: `pnpm --filter @muyajs/core test:spec`. The runner reads
`expected-failures.json` to lock the baseline: any example currently
listed that starts passing fails the suite (you must remove it), and any
example NOT listed must continue to pass. Net result: compliance can only
go up.

Spec runners call `renderToStaticHTML(..., { sanitize: false })` — they
measure the *parser*'s spec compliance, not the DOMPurify sanitiser
(which is correctly aggressive and would strip raw-HTML allowance examples).

## Headline

| Suite | Passed | Total | Pass rate |
|---|---|---|---|
| CommonMark 0.31 | 577 | 652 | 88.5% |
| GFM 0.29-gfm | 585 | 672 | 87.1% |

## CommonMark 0.31 — pass rate by section

| Section | Passed | Total | Pass rate |
|---|---|---|---|
| ATX headings | 17 | 18 | 94.4% |
| Autolinks | 14 | 19 | 73.7% |
| Backslash escapes | 12 | 13 | 92.3% |
| Blank lines | 1 | 1 | 100.0% |
| Block quotes | 23 | 25 | 92.0% |
| Code spans | 22 | 22 | 100.0% |
| Emphasis and strong emphasis | 132 | 132 | 100.0% |
| Entity and numeric character references | 5 | 17 | 29.4% |
| Fenced code blocks | 28 | 29 | 96.6% |
| Hard line breaks | 14 | 15 | 93.3% |
| HTML blocks | 43 | 44 | 97.7% |
| Images | 22 | 22 | 100.0% |
| Indented code blocks | 11 | 12 | 91.7% |
| Inlines | 1 | 1 | 100.0% |
| Link reference definitions | 26 | 27 | 96.3% |
| Links | 76 | 90 | 84.4% |
| List items | 42 | 48 | 87.5% |
| Lists | 21 | 26 | 80.8% |
| Paragraphs | 4 | 8 | 50.0% |
| Precedence | 1 | 1 | 100.0% |
| Raw HTML | 18 | 20 | 90.0% |
| Setext headings | 22 | 27 | 81.5% |
| Soft line breaks | 1 | 2 | 50.0% |
| Tabs | 1 | 11 | 9.1% |
| Textual content | 2 | 3 | 66.7% |
| Thematic breaks | 18 | 19 | 94.7% |

### Failing examples (CommonMark 0.31)

75 examples currently fail. Numbers are locked in `expected-failures.json`:

> 1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 25, 26, 27, 28, 30, 32, 33, 34, 37, 38, 39, 40, 49, 70, 82, 84, 87, 89, 93, 113, 133, 174, 197, 222, 223, 224, 226, 241, 252, 255, 275, 276, 280, 294, 296, 307, 319, 320, 321, 323, 503, 512, 518, 519, 520, 524, 526, 528, 532, 533, 536, 538, 540, 552, 595, 602, 608, 611, 612, 620, 622, 645, 649, 650

## GFM 0.29-gfm — pass rate by section

| Section | Passed | Total | Pass rate |
|---|---|---|---|
| ATX headings | 17 | 18 | 94.4% |
| Autolinks | 14 | 19 | 73.7% |
| Autolinks (extension) | 9 | 11 | 81.8% |
| Backslash escapes | 12 | 13 | 92.3% |
| Blank lines | 1 | 1 | 100.0% |
| Block quotes | 23 | 25 | 92.0% |
| Code spans | 22 | 22 | 100.0% |
| Disallowed Raw HTML (extension) | 0 | 1 | 0.0% |
| Emphasis and strong emphasis | 122 | 131 | 93.1% |
| Entity and numeric character references | 5 | 17 | 29.4% |
| Fenced code blocks | 28 | 29 | 96.6% |
| Hard line breaks | 14 | 15 | 93.3% |
| HTML blocks | 42 | 43 | 97.7% |
| Images | 22 | 22 | 100.0% |
| Indented code blocks | 11 | 12 | 91.7% |
| Inlines | 1 | 1 | 100.0% |
| Link reference definitions | 27 | 28 | 96.4% |
| Links | 74 | 87 | 85.1% |
| List items | 42 | 48 | 87.5% |
| Lists | 21 | 26 | 80.8% |
| Paragraphs | 4 | 8 | 50.0% |
| Precedence | 1 | 1 | 100.0% |
| Raw HTML | 18 | 20 | 90.0% |
| Setext headings | 22 | 27 | 81.5% |
| Soft line breaks | 1 | 2 | 50.0% |
| Strikethrough (extension) | 2 | 2 | 100.0% |
| Tables (extension) | 8 | 8 | 100.0% |
| Tabs | 1 | 11 | 9.1% |
| Task list items (extension) | 1 | 2 | 50.0% |
| Textual content | 2 | 3 | 66.7% |
| Thematic breaks | 18 | 19 | 94.7% |

### Failing examples (GFM 0.29-gfm)

87 examples currently fail. Numbers are locked in `expected-failures.json`:

> 1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 19, 40, 52, 54, 57, 59, 63, 83, 103, 143, 166, 192, 193, 194, 196, 219, 230, 233, 253, 254, 258, 272, 274, 280, 287, 299, 300, 301, 303, 308, 321, 322, 323, 324, 326, 328, 329, 330, 333, 334, 335, 336, 398, 426, 434, 435, 436, 473, 474, 475, 477, 511, 520, 526, 527, 528, 532, 534, 536, 540, 541, 544, 546, 560, 603, 610, 616, 619, 620, 626, 630, 639, 641, 652, 665, 669, 670
