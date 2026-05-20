// Visible line count for a code block, matching marktext `a028a7c2`:
//   - any inner `\n` adds a row
//   - a trailing `\n` produces an extra (visible empty) row in contenteditable
const NEW_LINE_EXP = /\n(?!$)/g;

export function computeLineCount(text: string): number {
    const match = text.match(NEW_LINE_EXP);
    let lines = match ? match.length + 1 : 1;
    if (text.endsWith('\n'))
        lines++;
    return lines;
}

export function renderLineNumbersInnerHTML(text: string): string {
    return '<span></span>'.repeat(computeLineCount(text));
}

export const LINE_NUMBERS_ROWS_CLASS = 'mu-line-numbers-rows';

export function lineNumbersWrapperHTML(text: string): string {
    return `<span class="${LINE_NUMBERS_ROWS_CLASS}" contenteditable="false" aria-hidden="true">${renderLineNumbersInnerHTML(text)}</span>`;
}
