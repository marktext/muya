/* eslint-disable antfu/no-top-level-await */
import type { IMuyaOptions, TState } from '@muyajs/core';
import {
    CodeBlockLanguageSelector,
    EmojiSelector,
    en,
    FootnoteTool,
    ImageEditTool,
    ImageResizeBar,
    ImageToolBar,
    InlineFormatToolbar,
    ja,
    LinkTools,
    MarkdownToHtml,
    Muya,
    ParagraphFrontButton,
    ParagraphFrontMenu,
    ParagraphQuickInsertMenu,
    PreviewToolBar,
    TableColumnToolbar,
    TableDragBar,
    TableRowColumMenu,
    zh,
} from '@muyajs/core';
import './style.css';

// Intl.Segmenter polyfill — required on Firefox; harmless on Chromium.
// eslint-disable-next-line no-restricted-syntax -- forced cast: `Intl` is augmented globally in types.d.ts to declare `Segmenter`, but TS still types `globalThis.Intl` as `{}` for the runtime side. We narrow via a private alias rather than poking the global namespace from the polyfill site.
const intlNs = Intl as unknown as { Segmenter?: typeof Intl.Segmenter };
if (!intlNs.Segmenter) {
    const polyfill = await import('intl-segmenter-polyfill/dist/bundled');
    intlNs.Segmenter = await polyfill.createIntlSegmenterPolyfill() as typeof Intl.Segmenter;
}

// Deterministic mocks: specs assert these exact URLs / delays.
const PICKED_IMAGE_URL = 'https://example.test/picked-image.png';
const UPLOADED_IMAGE_URL = 'https://example.test/uploaded-image.png';
async function imagePathPicker() {
    return PICKED_IMAGE_URL;
}
async function imageAction() {
    return UPLOADED_IMAGE_URL;
}

// Record jumpClick invocations so specs can assert via window.__e2e.linkJumps.
const linkJumps: Array<{ href?: string }> = [];

Muya.use(EmojiSelector);
Muya.use(FootnoteTool);
Muya.use(InlineFormatToolbar);
Muya.use(ImageEditTool, { imagePathPicker, imageAction });
Muya.use(ImageToolBar);
Muya.use(ImageResizeBar);
Muya.use(CodeBlockLanguageSelector);
Muya.use(LinkTools, {
    jumpClick: (linkInfo: { href?: string } | null) => {
        linkJumps.push({ href: linkInfo?.href });
    },
});
Muya.use(ParagraphFrontButton);
Muya.use(ParagraphFrontMenu);
Muya.use(TableColumnToolbar);
Muya.use(ParagraphQuickInsertMenu);
Muya.use(TableDragBar);
Muya.use(TableRowColumMenu);
Muya.use(PreviewToolBar);

const INITIAL_MARKDOWN = `# Muya E2E

A paragraph with **bold**, *italic*, \`code\`, and a [link](https://example.com).

- item one
- item two
`;

// `satisfies` guards against silently-renamed option keys — if `IMuyaOptions`
// ever drops `footnote` or `codeBlockLineNumbers`, host fails to compile
// before specs go red. Same pattern as examples/src/main.ts:INITIAL_OPTIONS.
const HOST_OPTIONS = {
    footnote: true,
    codeBlockLineNumbers: true,
} satisfies Partial<IMuyaOptions>;

// `editor-container` parents the live `#editor` div. Phase 4 rebuilds
// destroy → re-create the editor under this parent (the destroy() call
// removes the previous #editor from the DOM, so we need a new node to
// host the next Muya).
const editorParent = document.querySelector<HTMLElement>('.editor-container')!;

function makeEditorNode(): HTMLElement {
    const node = document.createElement('div');
    node.id = 'editor';
    editorParent.appendChild(node);
    return node;
}

function bootMuya(container: HTMLElement, options: Partial<IMuyaOptions>): Muya {
    const next = new Muya(container, { markdown: INITIAL_MARKDOWN, ...options });
    next.locale(en);
    next.init();
    return next;
}

const initialContainer = document.querySelector<HTMLElement>('#editor')!;
let muya = bootMuya(initialContainer, HOST_OPTIONS);

window.muya = muya;
window.MarkdownToHtml = MarkdownToHtml;
window.__e2e = {
    linkJumps,
    INITIAL_MARKDOWN,
    PICKED_IMAGE_URL,
    UPLOADED_IMAGE_URL,
    rebuildMuya: (options: Partial<IMuyaOptions> = {}) => {
        muya.destroy();
        const fresh = makeEditorNode();
        muya = bootMuya(fresh, { ...HOST_OPTIONS, ...options });
        window.muya = muya;
    },
};

// Toolbar wiring (mirrors the buttons declared in index.html).
const $ = <T extends HTMLElement>(id: string): T => document.querySelector<T>(id)!;

$<HTMLSelectElement>('#language-select').addEventListener('change', (event) => {
    const lang = (event.target as HTMLSelectElement).value;
    if (lang === 'en')
        muya.locale(en);
    else if (lang === 'ja')
        muya.locale(ja);
    else if (lang === 'zh')
        muya.locale(zh);
});

$<HTMLButtonElement>('#undo').addEventListener('click', () => muya.undo());
$<HTMLButtonElement>('#redo').addEventListener('click', () => muya.redo());

$<HTMLInputElement>('#search').addEventListener('input', (event) => {
    muya.search((event.target as HTMLInputElement).value, { isRegexp: false });
});
$<HTMLButtonElement>('#previous').addEventListener('click', () => muya.find('previous'));
$<HTMLButtonElement>('#next').addEventListener('click', () => muya.find('next'));

$<HTMLButtonElement>('#single').addEventListener('click', () => {
    muya.replace($<HTMLInputElement>('#replace').value, { isSingle: true, isRegexp: false });
});
$<HTMLButtonElement>('#all').addEventListener('click', () => {
    muya.replace($<HTMLInputElement>('#replace').value, { isSingle: false, isRegexp: false });
});

$<HTMLButtonElement>('#set-content').addEventListener('click', () => {
    muya.setContent([{ name: 'paragraph', text: 'set-content fired' }] as TState[]);
});
$<HTMLButtonElement>('#select-all').addEventListener('click', () => muya.selectAll());
