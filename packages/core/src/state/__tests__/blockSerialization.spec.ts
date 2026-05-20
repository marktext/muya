import { describe, expect, it } from 'vitest';
import { MarkdownToState } from '../markdownToState';
import ExportMarkdown from '../stateToMarkdown';

// Round-trip baseline for non-list block types served by `stateToMarkdown`.
// Each spec runs `markdown → state → markdown` and asserts identity for
// canonical inputs. The intent is regression coverage — these tests should
// not change behaviour, just lock the current contract in place so a
// future refactor of stateToMarkdown can't silently break it.
function roundTrip(md: string): string {
    const states = new MarkdownToState({
        footnote: false,
        math: true,
        isGitlabCompatibilityEnabled: false,
        trimUnnecessaryCodeBlockEmptyLines: false,
        frontMatter: true,
    }).generate(md);
    return new ExportMarkdown({ listIndentation: 1 }).generate(states);
}

describe('stateToMarkdown — heading round-trip', () => {
    it('round-trips an atx heading at every level', () => {
        const md = `# h1

## h2

### h3

#### h4

##### h5

###### h6
`;
        expect(roundTrip(md)).toBe(md);
    });

    it('round-trips a setext h1 with `===` underline', () => {
        const md = `Hello world
===========
`;
        expect(roundTrip(md)).toBe(md);
    });

    it('round-trips a setext h2 with `---` underline', () => {
        const md = `Hello world
-----------
`;
        expect(roundTrip(md)).toBe(md);
    });

    it('round-trips a thematic break', () => {
        const md = `before

---

after
`;
        expect(roundTrip(md)).toBe(md);
    });
});

describe('stateToMarkdown — code block round-trip', () => {
    it('round-trips a fenced code block with a language tag', () => {
        const md = `\`\`\`js
const x = 1;
const y = 2;
\`\`\`
`;
        expect(roundTrip(md)).toBe(md);
    });

    it('round-trips a fenced code block without a language tag', () => {
        const md = `\`\`\`
plain code
two lines
\`\`\`
`;
        expect(roundTrip(md)).toBe(md);
    });

    it('round-trips a fenced code block containing blank lines', () => {
        const md = `\`\`\`js
line 1

line 3
\`\`\`
`;
        expect(roundTrip(md)).toBe(md);
    });
});

describe('stateToMarkdown — blockquote round-trip', () => {
    it('round-trips a single-line blockquote', () => {
        const md = `> quoted
`;
        expect(roundTrip(md)).toBe(md);
    });

    it('round-trips a multi-line blockquote', () => {
        const md = `> first line
> second line
> third line
`;
        expect(roundTrip(md)).toBe(md);
    });

    it('round-trips a nested blockquote', () => {
        const md = `> outer
>
> > inner quoted
`;
        expect(roundTrip(md)).toBe(md);
    });
});

describe('stateToMarkdown — math block round-trip', () => {
    it('round-trips a `$$`-delimited math block', () => {
        const md = `$$
a^2 + b^2 = c^2
$$
`;
        expect(roundTrip(md)).toBe(md);
    });
});

describe('stateToMarkdown — table round-trip', () => {
    // The column width emitted by stateToMarkdown is `max(5, cell+2)`, so a
    // table with single-character cells canonicalises to width-5 columns.
    it('round-trips a simple 2x2 table with default alignment', () => {
        const md = `| a   | b   |
| --- | --- |
| 1   | 2   |
`;
        expect(roundTrip(md)).toBe(md);
    });

    it('round-trips a table with explicit left/center/right alignment', () => {
        const md = `| a   | b   | c   |
|:--- |:---:| ---:|
| 1   | 2   | 3   |
`;
        expect(roundTrip(md)).toBe(md);
    });
});

describe('stateToMarkdown — frontmatter round-trip', () => {
    it('round-trips a YAML frontmatter block', () => {
        // FRONT_REG (utils/marked/frontMatter.ts) requires two newlines
        // after the closing `---`, so canonical YAML frontmatter has a
        // blank line before the document body.
        const md = `---
title: hello
author: world
---

# body
`;
        expect(roundTrip(md)).toBe(md);
    });
});
