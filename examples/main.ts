import Muya from '../packages/index';
import zh from '../packages/locales/zh';
import MD2Html from '../packages/state/markdownToHtml';
import { TState } from '../packages/state/types';
import {
  CodeBlockLanguageSelector,
  EmojiSelector,
  ImageEditTool,
  ImageResizeBar,
  ImageToolBar,
  InlineFormatToolbar,
  ParagraphFrontButton,
  ParagraphFrontMenu,
  ParagraphQuickInsertMenu,
  PreviewToolBar,
  TableColumnToolbar,
  TableDragBar,
  TableRowColumMenu,
} from '../packages/ui/index';
import { DEFAULT_MARKDOWN } from './mock';

import './style.css';

// import "../packages/assets/style.css";

// Fix Intl.Segmenter is not work on firefox.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (!(Intl as any).Segmenter) {
  const polyfill = await import('intl-segmenter-polyfill/dist/bundled');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Intl as any).Segmenter = await polyfill.createIntlSegmenterPolyfill();
}

const imagePathPicker = async () => {
  return 'https://pics.ettoday.net/images/2253/d2253152.jpg';
};

const imageAction = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        'https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg'
      );
    }, 3000);
  });
};

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
const setContentBtn: HTMLButtonElement =
  document.querySelector('#set-content')!;
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
muya.on('json-change', (_changes) => {
  // console.log(JSON.stringify(muya.getState(), null, 2))
  // console.log(muya.getMarkdown())
  // console.log(JSON.stringify(_changes, null, 2));
});

// muya.on('selection-change', changes => {
//   const { anchor, focus, path } = changes
//   console.log(JSON.stringify([anchor.offset, focus.offset, path]))
// })

const md2Html = new MD2Html(DEFAULT_MARKDOWN);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
md2Html.generate().then((_html) => {
  // const container = document.createElement("div");
  // container.innerHTML = _html;
  // document.body.appendChild(container);
  // console.log(_html);
});
