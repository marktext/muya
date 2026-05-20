import { describe, expect, it } from 'vitest';
import { MarkdownToState } from '../markdownToState';

function generate(markdown: string) {
    return new MarkdownToState({
        footnote: false,
        math: false,
        isGitlabCompatibilityEnabled: false,
        trimUnnecessaryCodeBlockEmptyLines: false,
        frontMatter: false,
    }).generate(markdown);
}

// Defensive regression test for marktext commit 23435ce6 (#1733 / PR #1835).
// In the legacy marked fork that marktext shipped, the list tokenizer forgot
// to subtract the four-character `[x] ` checkbox prefix from the indentation
// counter — so a `- [ ] task1_1` two levels deep was read as a sibling of
// `- [ ] task1`. The new muya drives lists through marked v16's built-in
// tokenizer (with the `compatibleTaskList` post-processor splitting on
// bullet vs task), which doesn't share that codepath. These specs lock in
// the correct nesting so a future list refactor can't quietly re-introduce
// the flattening.
describe('markdownToState — task list nesting (marktext 23435ce6)', () => {
    it('keeps three levels of task-list nesting', () => {
        const md = `- [ ] task1

  - [ ] task1_1

    - [ ] task1_1_1
`;

        const states = generate(md);

        // Outer list must contain exactly one task-list-item with a nested
        // bullet/task list as its second child (first being the text para).
        expect(states.length).toBe(1);
        const outer = states[0] as any;
        expect(outer.name).toBe('task-list');
        expect(outer.children.length).toBe(1);

        const level1 = outer.children[0];
        expect(level1.name).toBe('task-list-item');
        expect(level1.meta).toEqual({ checked: false });
        const level1Paragraph = level1.children.find((c: any) => c.name === 'paragraph');
        expect(level1Paragraph?.text).toBe('task1');

        const level1Nested = level1.children.find((c: any) => c.name === 'task-list');
        expect(level1Nested, 'level 1 should contain a nested bullet-list').toBeDefined();
        expect(level1Nested.children.length).toBe(1);

        const level2 = level1Nested.children[0];
        expect(level2.name).toBe('task-list-item');
        expect(level2.children.find((c: any) => c.name === 'paragraph')?.text).toBe('task1_1');

        const level2Nested = level2.children.find((c: any) => c.name === 'task-list');
        expect(level2Nested, 'level 2 should contain a nested bullet-list — not a sibling').toBeDefined();
        expect(level2Nested.children.length).toBe(1);

        const level3 = level2Nested.children[0];
        expect(level3.name).toBe('task-list-item');
        expect(level3.children.find((c: any) => c.name === 'paragraph')?.text).toBe('task1_1_1');
    });

    it('keeps tight (no blank lines) nested task lists nested', () => {
        const md = `- [ ] task1
  - [ ] task1_1
    - [ ] task1_1_1
`;

        const states = generate(md);

        expect(states.length).toBe(1);
        const outer = states[0] as any;
        expect(outer.name).toBe('task-list');

        const level1 = outer.children[0];
        const level1Nested = level1.children.find((c: any) => c.name === 'task-list');
        expect(level1Nested).toBeDefined();
        const level2 = level1Nested.children[0];
        const level2Nested = level2.children.find((c: any) => c.name === 'task-list');
        expect(level2Nested, 'level 2 should contain level 3 nested, not as sibling').toBeDefined();
    });
});
