/**
 * Single source of truth for DOM selectors used by E2E specs.
 *
 * If the editor's class names change (e.g. the .mu-* prefix or floating UI
 * data attributes), update them here — specs should never hard-code selectors.
 */

export const editor = {
    container: '#editor',
    root: '.mu-editor',
    paragraph: '.mu-paragraph',
    atxHeading: '.mu-atx-heading',
    setextHeading: '.mu-setext-heading',
    blockQuote: '.mu-block-quote',
    bulletList: '.mu-bullet-list',
    orderList: '.mu-order-list',
    taskList: '.mu-task-list',
    taskListItem: '.mu-task-list-item',
    thematicBreak: '.mu-thematic-break',
    codeBlock: '.mu-code-block',
    fenceCode: '.mu-fence-code',
    languageInput: '.mu-language-input',
    table: 'table',
    tableCell: '.mu-table-cell',
    htmlBlock: '.mu-html-block',
    htmlPreview: '.mu-html-preview',
    mathBlock: '.mu-math-block',
    mathRender: '.mu-math-render',
    katex: '.katex',
    diagramBlock: '.mu-diagram-block',
    diagramPreview: '.mu-diagram-preview',
    image: '.mu-inline-image',
    inlineFootnoteIdentifier: '.mu-inline-footnote-identifier',
    link: 'span.mu-link, a.mu-reference-link, a.mu-raw-html',
} as const;

// Float root class names confirmed against the `const name = 'mu-...'` lines
// inside each plugin's index.ts.
export const floats = {
    inlineFormatToolbar: '.mu-format-picker',
    quickInsert: '.mu-quick-insert',
    paragraphFrontButton: '.mu-front-button-wrapper',
    paragraphFrontMenu: '.mu-front-menu',
    emojiPicker: '.mu-emoji-picker',
    linkTools: '.mu-link-tools',
    imageToolbar: '.mu-image-toolbar',
    imageEditTool: '.mu-image-selector',
    codeBlockLanguageSelector: '.mu-list-picker',
    tableColumnTools: '.mu-table-column-tools',
    tableRowColumMenu: '.mu-table-bar-tools',
    tableDragBar: '.mu-table-drag-bar',
    footnoteTool: '.mu-footnote-tool',
    previewToolBar: '.mu-preview-tools',
} as const;

/** Slash-menu item locator: `[data-label="atx-heading 1"]` etc. */
export function quickInsertItem(label: string): string {
    return `${floats.quickInsert} [data-label="${label}"]`;
}

export const toolbar = {
    undo: '#undo',
    redo: '#redo',
    search: '#search',
    previous: '#previous',
    next: '#next',
    replace: '#replace',
    single: '#single',
    all: '#all',
    setContent: '#set-content',
    selectAll: '#select-all',
    languageSelect: '#language-select',
} as const;
