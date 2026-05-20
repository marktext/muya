// Shared CommonMark / GFM spec runner.
//
// Two responsibilities:
//   1. Normalize HTML so trivial output differences (whitespace, self-closing
//      style, attribute order) don't masquerade as compliance failures.
//   2. Implement the "expected-failures" regression-lock contract documented
//      in test/spec/expected-failures.json.
//
// Why a hand-rolled normalizer instead of `diff` of raw strings?
//   The reference implementation (cmark) emits compact HTML. marked + our
//   wrappers emit equivalent but slightly different HTML: extra spaces around
//   self-closing `<br/>`, attribute ordering from DOMPurify, optional trailing
//   newlines. We collapse those before comparing. Anything more semantic
//   (e.g. parsing both sides with a real HTML parser) is overkill at this
//   stage — the bar is "is muya within shouting distance of the spec".

import expectedFailuresRaw from './expected-failures.json';

export interface ISpecExample {
    markdown: string;
    html: string;
    section: string;
    number: number;
}

export interface IRunResult {
    passed: boolean;
    actual: string;
    expected: string;
    normalizedActual: string;
    normalizedExpected: string;
}

/**
 * Canonicalise an HTML fragment so trivially-different but semantically-equal
 * outputs compare equal:
 *   - Whitespace: collapsing inside text nodes would corrupt `pre` content,
 *     so we only trim trailing whitespace per line, collapse blank-line
 *     runs to one newline, and strip leading / trailing newlines.
 *   - Sort tag attributes alphabetically so `<a href="x" title="y">` and
 *     `<a title="y" href="x">` match.
 *   - Normalise self-closing form: `<br />` / `<br/>` / `<br>` → `<br />`.
 *
 * NOTE: Intentionally conservative. False-negatives (real bugs masked by
 * aggressive normalisation) are worse than false-positives (cosmetic diffs
 * surfaced as failures). We can tighten over time.
 */
export function normalizeHtml(html: string): string {
    let out = html;

    // Normalise self-closing void elements to `<br />` style consistently.
    const voidTags = ['br', 'hr', 'img', 'wbr', 'input'];
    for (const tag of voidTags) {
        const re = new RegExp(`<${tag}((?:\\s+[^>]*?)?)\\s*/?\\s*>`, 'gi');
        out = out.replace(re, (_m, attrs: string) => {
            const trimmed = attrs.trim();
            return trimmed ? `<${tag} ${trimmed} />` : `<${tag} />`;
        });
    }

    // Sort attributes inside tags alphabetically. Skip closing tags and
    // self-closed void tags we already handled, but the sort below is safe
    // to re-apply.
    //
    // The separator between tag name and attrs uses `[ \t\n\r]+` (concrete
    // whitespace chars) and the attrs portion is anchored to start with
    // a non-whitespace `\S`. This rules out the polynomial backtracking
    // case where `\s+` and `\s` inside `[^>]*?` could exchange characters.
    out = out.replace(
        /<([a-z][\w-]*)[ \t\n\r]+(\S[^>]*?)(\/?)>/gi,
        (_m, name: string, attrs: string, selfClose: string) => {
            // Parse attrs of the form: name | name="value" | name='value'
            const parsed: Array<[string, string]> = [];
            const re = /([a-z_:][\w:.-]*)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'>`]+))?/gi;
            let m: RegExpExecArray | null;
            // eslint-disable-next-line no-cond-assign
            while ((m = re.exec(attrs))) {
                parsed.push([m[1], m[2] ?? '']);
            }
            parsed.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
            const rebuilt = parsed
                .map(([k, v]) => (v === '' ? k : `${k}=${v}`))
                .join(' ');
            const sc = selfClose ? ' /' : '';
            return rebuilt
                ? `<${name} ${rebuilt}${sc}>`
                : `<${name}${sc}>`;
        },
    );

    // Strip leading/trailing whitespace, collapse runs of blank lines.
    out = out
        .split('\n')
        .map(line => line.replace(/\s+$/, ''))
        .join('\n')
        .replace(/\n{2,}/g, '\n')
        .replace(/^\n+|\n+$/g, '');

    return out;
}

/**
 * Compare a rendered HTML string against the spec's expected HTML.
 * Equality is decided after `normalizeHtml`, so both sides are returned
 * (raw + normalised) for diagnostic output.
 */
export function compareHtml(actual: string, expected: string): IRunResult {
    const normalizedActual = normalizeHtml(actual);
    const normalizedExpected = normalizeHtml(expected);
    return {
        passed: normalizedActual === normalizedExpected,
        actual,
        expected,
        normalizedActual,
        normalizedExpected,
    };
}

interface IExpectedFailures {
    commonmark: number[];
    gfm: number[];
}

const expectedFailures: IExpectedFailures
    = expectedFailuresRaw as IExpectedFailures;

export function getExpectedFailures(suite: 'commonmark' | 'gfm'): Set<number> {
    return new Set(expectedFailures[suite] ?? []);
}

/**
 * Format a failure diagnostic. Used in `expect(...).toBe(...)` assertion
 * messages so vitest's diff output shows the actual / expected HTML side-by-
 * side, with the markdown source as context.
 */
export function formatFailureMessage(
    example: ISpecExample,
    result: IRunResult,
): string {
    return [
        '',
        `--- markdown (${example.section} #${example.number}) ---`,
        JSON.stringify(example.markdown),
        '--- expected (normalised) ---',
        result.normalizedExpected,
        '--- actual (normalised) ---',
        result.normalizedActual,
        '',
    ].join('\n');
}
