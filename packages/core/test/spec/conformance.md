# CommonMark / GFM spec conformance

Baseline captured at PR-6a (2026-05-20).

Re-run via: `pnpm --filter @muyajs/core test:spec`. The runner reads
`expected-failures.json` to lock the baseline: any example currently
listed that starts passing fails the suite (you must remove it), and any
example NOT listed must continue to pass. Net result: compliance can only
go up.

## Headline

| Suite | Passed | Total | Pass rate |
|---|---|---|---|
| CommonMark 0.31 | 451 | 652 | 69.2% |
| GFM 0.29-gfm | 455 | 672 | 67.7% |

## CommonMark 0.31 — pass rate by section

| Section | Passed | Total | Pass rate |
|---|---|---|---|
| ATX headings | 17 | 18 | 94.4% |
| Autolinks | 11 | 19 | 57.9% |
| Backslash escapes | 9 | 13 | 69.2% |
| Blank lines | 1 | 1 | 100.0% |
| Block quotes | 21 | 25 | 84.0% |
| Code spans | 18 | 22 | 81.8% |
| Emphasis and strong emphasis | 123 | 132 | 93.2% |
| Entity and numeric character references | 10 | 17 | 58.8% |
| Fenced code blocks | 22 | 29 | 75.9% |
| Hard line breaks | 5 | 15 | 33.3% |
| HTML blocks | 18 | 44 | 40.9% |
| Images | 21 | 22 | 95.5% |
| Indented code blocks | 7 | 12 | 58.3% |
| Inlines | 1 | 1 | 100.0% |
| Link reference definitions | 21 | 27 | 77.8% |
| Links | 73 | 90 | 81.1% |
| List items | 18 | 48 | 37.5% |
| Lists | 8 | 26 | 30.8% |
| Paragraphs | 3 | 8 | 37.5% |
| Precedence | 1 | 1 | 100.0% |
| Raw HTML | 3 | 20 | 15.0% |
| Setext headings | 19 | 27 | 70.4% |
| Soft line breaks | 1 | 2 | 50.0% |
| Tabs | 1 | 11 | 9.1% |
| Textual content | 3 | 3 | 100.0% |
| Thematic breaks | 16 | 19 | 84.2% |

### Failing examples (CommonMark 0.31)

201 examples currently fail. Numbers are locked in `expected-failures.json`:

> 1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 21, 25, 27, 31, 32, 33, 40, 41, 49, 56, 61, 70, 82, 84, 85, 87, 89, 91, 93, 100, 108, 109, 113, 114, 115, 126, 128, 130, 133, 140, 141, 144, 148, 150, 151, 152, 155, 156, 157, 158, 163, 165, 169, 170, 172, 173, 174, 175, 176, 177, 178, 179, 180, 182, 183, 184, 187, 191, 196, 201, 209, 210, 211, 212, 222, 223, 224, 225, 226, 236, 237, 241, 252, 253, 254, 255, 256, 258, 259, 262, 263, 264, 270, 271, 272, 273, 274, 275, 276, 277, 278, 280, 286, 287, 288, 290, 292, 293, 294, 296, 298, 299, 300, 306, 307, 308, 309, 311, 313, 314, 315, 316, 317, 318, 319, 320, 321, 323, 324, 325, 326, 333, 334, 343, 344, 352, 353, 359, 363, 380, 385, 395, 476, 477, 491, 494, 503, 508, 512, 518, 519, 520, 524, 526, 528, 532, 533, 536, 538, 540, 552, 590, 596, 598, 599, 601, 602, 608, 611, 612, 613, 614, 615, 616, 617, 619, 620, 623, 624, 625, 626, 627, 628, 629, 630, 631, 632, 633, 634, 635, 636, 637, 638, 639, 642, 643, 645, 649

## GFM 0.29-gfm — pass rate by section

| Section | Passed | Total | Pass rate |
|---|---|---|---|
| ATX headings | 17 | 18 | 94.4% |
| Autolinks | 11 | 19 | 57.9% |
| Autolinks (extension) | 11 | 11 | 100.0% |
| Backslash escapes | 9 | 13 | 69.2% |
| Blank lines | 1 | 1 | 100.0% |
| Block quotes | 21 | 25 | 84.0% |
| Code spans | 18 | 22 | 81.8% |
| Disallowed Raw HTML (extension) | 0 | 1 | 0.0% |
| Emphasis and strong emphasis | 113 | 131 | 86.3% |
| Entity and numeric character references | 10 | 17 | 58.8% |
| Fenced code blocks | 22 | 29 | 75.9% |
| Hard line breaks | 5 | 15 | 33.3% |
| HTML blocks | 17 | 43 | 39.5% |
| Images | 21 | 22 | 95.5% |
| Indented code blocks | 7 | 12 | 58.3% |
| Inlines | 1 | 1 | 100.0% |
| Link reference definitions | 22 | 28 | 78.6% |
| Links | 71 | 87 | 81.6% |
| List items | 18 | 48 | 37.5% |
| Lists | 8 | 26 | 30.8% |
| Paragraphs | 3 | 8 | 37.5% |
| Precedence | 1 | 1 | 100.0% |
| Raw HTML | 3 | 20 | 15.0% |
| Setext headings | 19 | 27 | 70.4% |
| Soft line breaks | 1 | 2 | 50.0% |
| Strikethrough (extension) | 2 | 2 | 100.0% |
| Tables (extension) | 2 | 8 | 25.0% |
| Tabs | 1 | 11 | 9.1% |
| Task list items (extension) | 1 | 2 | 50.0% |
| Textual content | 3 | 3 | 100.0% |
| Thematic breaks | 16 | 19 | 84.2% |

### Failing examples (GFM 0.29-gfm)

217 examples currently fail. Numbers are locked in `expected-failures.json`:

> 1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 19, 26, 31, 40, 52, 54, 55, 57, 59, 61, 63, 70, 78, 79, 83, 84, 85, 96, 98, 100, 103, 110, 111, 114, 118, 120, 121, 122, 125, 126, 127, 128, 133, 135, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 151, 152, 153, 156, 160, 165, 170, 178, 179, 180, 181, 192, 193, 194, 195, 196, 198, 199, 200, 201, 202, 204, 214, 215, 219, 230, 231, 232, 233, 234, 236, 237, 240, 241, 242, 248, 249, 250, 251, 252, 253, 254, 255, 256, 258, 264, 265, 266, 268, 270, 271, 272, 274, 276, 277, 278, 280, 286, 287, 288, 289, 291, 293, 294, 295, 296, 297, 298, 299, 300, 301, 303, 304, 305, 306, 308, 310, 312, 317, 321, 323, 327, 328, 329, 336, 337, 343, 344, 353, 354, 362, 363, 368, 372, 389, 394, 398, 404, 426, 434, 435, 436, 473, 474, 475, 477, 485, 486, 500, 503, 511, 516, 520, 526, 527, 528, 532, 534, 536, 540, 541, 544, 546, 560, 598, 604, 606, 607, 609, 610, 616, 619, 620, 632, 633, 634, 635, 636, 638, 639, 642, 643, 644, 645, 646, 647, 648, 649, 650, 651, 652, 653, 654, 655, 656, 657, 658, 659, 662, 663, 665, 669
