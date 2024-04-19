<p  align="center"><img  src="./docs/logo.jpg"  alt="muya"  height="150"></p>

**Muya** originated from [MarkText](https://github.com/marktext/marktext), which was originally used in the MarkText and provides Markdown editing support for MarkText. Today, Muya is available as a stand-alone library that provides an efficient Markdown editing experience for many web browser applications.

:a: Muya is still under development and should not be used for production.

## Installing

```sh
npm install @muyajs/core
```

## Quick Start

```typescript
import {
    CodeBlockLanguageSelector,
    EmojiSelector,
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

Muya.use(EmojiSelector);
Muya.use(InlineFormatToolbar);
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

import '@muyajs/core/lib/style.css';

const container = document.querySelector('#editor');
const muya = new Muya(container, {
    markdown: 'Hello world',
});

muya.locale(zh);

muya.init();
```

There is also an [example](https://github.com/marktext/muya/tree/master/examples) of how to use muya in Typescript.

## Documents

Coming soon!!!

## Development

[commit-msg-guideline](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#-commit-message-guidelines)

```sh
# step1: install dependencies
pnpm install
# step2: run the development codes
pnpm run dev
```

## Build

```sh
pnpm build
```

## publish

```sh
# update version numbers.
pnpm run release
# publish to npm.
pnpm -r publish
```

## FAQ

❓ **What is the relationship between MarkText and Muya?**

Muya is derived from MarkText. Our team believes that Muya should not be limited to desktop applications. It should also run in a web browser, so we have done some compatibility with browsers and Electron applications, so that Muya can leave Electron Apps and can run into different browser environments.

❓**What is the relationship between MarkText's version and the Muya's version?**

None!

## Built with muya

- [MarkText](https://github.com/marktext/marktext) - Next generation markdown editor, running on platforms of MacOS Windows and Linux.

- [MindBox](https://www.mindbox.cc/) - A note-taking app that perfectly supports markdown syntax.

## License

MIT © [Jocs](https://github.com/Jocs)
