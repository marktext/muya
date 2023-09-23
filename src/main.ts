import Muya from "../lib/index";
import {
  EmojiSelector,
  InlineFormatToolbar,
  ImageEditTool,
  ImageToolBar,
  ImageResizeBar,
  CodeBlockLanguageSelector,
  TableColumnToolbar,
  ParagraphQuickInsertMenu,
  TableDragBar,
  TableRowColumMenu,
  PreviewToolBar,
  ParagraphFrontButton,
  ParagraphFrontMenu,
} from "../lib/ui/index";
import zh from "../lib/locales/zh";
import MD2Html from "../lib/jsonState/markdownToHtml";
import { DEFAULT_STATE, DEFAULT_MARKDOWN } from "./mock";
import { TState } from "../lib/jsonState/types";

import "./style.css";

// import "../lib/assets/style.css";

const imagePathPicker = async () => {
  return "https://pics.ettoday.net/images/2253/d2253152.jpg";
};

const imageAction = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg");
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

const container: HTMLElement = document.querySelector("#editor")!;
const undoBtn: HTMLButtonElement = document.querySelector("#undo")!;
const redoBtn: HTMLButtonElement = document.querySelector("#redo")!;
const searchInput: HTMLInputElement = document.querySelector("#search")!;
const previousBtn: HTMLButtonElement = document.querySelector("#previous")!;
const nextBtn: HTMLButtonElement = document.querySelector("#next")!;
const replaceInput: HTMLInputElement = document.querySelector("#replace")!;
const singleBtn: HTMLButtonElement = document.querySelector("#single")!;
const allBtn: HTMLButtonElement = document.querySelector("#all")!;
const setContentBtn: HTMLButtonElement =
  document.querySelector("#set-content")!;
const selectAllBtn: HTMLButtonElement = document.querySelector("#select-all")!;


const muya = new Muya(container, {
  json: DEFAULT_STATE,
  disableHtml: true,
});

muya.locale(zh);

muya.init();

undoBtn.addEventListener("click", () => {
  muya.undo();
});

redoBtn.addEventListener("click", () => {
  muya.redo();
});

searchInput.addEventListener("input", (event) => {
  const value = (event.target as HTMLInputElement).value;

  muya.search(value, { isRegexp: true });
});

previousBtn.addEventListener("click", () => {
  muya.find("previous");
});

nextBtn.addEventListener("click", () => {
  muya.find("next");
});

singleBtn.addEventListener("click", () => {
  muya.replace(replaceInput.value, { isSingle: true, isRegexp: true });
});

allBtn.addEventListener("click", () => {
  muya.replace(replaceInput.value, { isSingle: false, isRegexp: false });
});

selectAllBtn.addEventListener("click", () => {
  muya.selectAll();
});

const content = [
  {
    name: "paragraph",
    text: "foo bar",
  },
];

setContentBtn.addEventListener("click", () => {
  muya.setContent(content as TState[]);
});

muya.on("json-change", (_changes) => {
  // console.log(JSON.stringify(muya.getState(), null, 2))
  // console.log(muya.getMarkdown())
  // console.log(JSON.stringify(changes, null, 2));
});

// muya.on('selection-change', changes => {
//   const { anchor, focus, path } = changes
//   console.log(JSON.stringify([anchor.offset, focus.offset, path]))
// })

const md2Html = new MD2Html(DEFAULT_MARKDOWN);
md2Html.generate({ printOptimization: true }).then((_html) => {
  // console.log('html: ', html)
});
