import type { TState } from '@muyajs/core';
import {
    CodeBlockLanguageSelector,
    EmojiSelector,
    ImageEditTool,
    ImageResizeBar,
    ImageToolBar,
    InlineFormatToolbar,
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

import { DEFAULT_MARKDOWN } from './data';

import './style.css';

// Fix Intl.Segmenter is not work on firefox.
if (!(Intl as any).Segmenter) {
    const polyfill = await import('intl-segmenter-polyfill/dist/bundled');
    (Intl as any).Segmenter = await polyfill.createIntlSegmenterPolyfill();
}

async function imagePathPicker() {
    return 'https://pics.ettoday.net/images/2253/d2253152.jpg';
}

async function imageAction() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(
                'https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg',
            );
        }, 3000);
    });
}

Muya.use(EmojiSelector);
Muya.use(InlineFormatToolbar);
Muya.use(ImageEditTool, {
    imagePathPicker,
    imageAction,
});
Muya.use(ImageToolBar);
Muya.use(ImageResizeBar);
Muya.use(CodeBlockLanguageSelector);

Muya.use(ParagraphFrontButton);
Muya.use(ParagraphFrontMenu);
Muya.use(TableColumnToolbar);
Muya.use(ParagraphQuickInsertMenu);
Muya.use(TableDragBar);
Muya.use(TableRowColumMenu);
Muya.use(PreviewToolBar);

const container: HTMLElement = document.querySelector('#editor')!;
const undoBtn: HTMLButtonElement = document.querySelector('#undo')!;
const redoBtn: HTMLButtonElement = document.querySelector('#redo')!;
const searchInput: HTMLInputElement = document.querySelector('#search')!;
const previousBtn: HTMLButtonElement = document.querySelector('#previous')!;
const nextBtn: HTMLButtonElement = document.querySelector('#next')!;
const replaceInput: HTMLInputElement = document.querySelector('#replace')!;
const singleBtn: HTMLButtonElement = document.querySelector('#single')!;
const allBtn: HTMLButtonElement = document.querySelector('#all')!;
const setContentBtn: HTMLButtonElement
  = document.querySelector('#set-content')!;
const selectAllBtn: HTMLButtonElement = document.querySelector('#select-all')!;

const muya = new Muya(container, {
    markdown: DEFAULT_MARKDOWN,
});

muya.locale(zh);

muya.init();

undoBtn.addEventListener('click', () => {
    muya.undo();
});

redoBtn.addEventListener('click', () => {
    muya.redo();
});

searchInput.addEventListener('input', (event) => {
    const value = (event.target as HTMLInputElement).value;

    muya.search(value, { isRegexp: true });
});

previousBtn.addEventListener('click', () => {
    muya.find('previous');
});

nextBtn.addEventListener('click', () => {
    muya.find('next');
});

singleBtn.addEventListener('click', () => {
    muya.replace(replaceInput.value, { isSingle: true, isRegexp: true });
});

allBtn.addEventListener('click', () => {
    muya.replace(replaceInput.value, { isSingle: false, isRegexp: false });
});

selectAllBtn.addEventListener('click', () => {
    muya.selectAll();
});

const content = [
    {
        name: 'paragraph',
        text: 'foo bar',
    },
];

setContentBtn.addEventListener('click', () => {
    muya.setContent(content as TState[]);
});

muya.on('json-change', (_changes) => {
    // console.log(JSON.stringify(muya.getState(), null, 2))
    // console.log(muya.getMarkdown())
    // console.log(JSON.stringify(_changes, null, 2));
});

// muya.on('selection-change', changes => {
//   const { anchor, focus, path } = changes
//   console.log(JSON.stringify([anchor.offset, focus.offset, path]))
// })

const md2Html = new MarkdownToHtml(DEFAULT_MARKDOWN);
md2Html.generate().then((_html) => {
    // const container = document.createElement("div");
    // container.innerHTML = _html;
    // document.body.appendChild(container);
    // console.log(_html);
});
