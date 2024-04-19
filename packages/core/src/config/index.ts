import htmlTags from 'html-tags';
import voidHtmlTags from 'html-tags/void';
import { genUpper2LowerKeyHash, generateKeyHash } from '../utils';
import { en } from '../locales/en';

export const VOID_HTML_TAGS = voidHtmlTags;
export const HTML_TAGS = htmlTags;
export const BLOCK_DOM_PROPERTY = '__MUYA_BLOCK__';

interface ITag {
    open: string;
    close: string;
}

export const FORMAT_MARKER_MAP: Record<string, string> = {
    em: '*',
    inline_code: '`',
    strong: '**',
    del: '~~',
    inline_math: '$',
};

export const FORMAT_TAG_MAP: Record<string, ITag> = {
    u: {
        open: '<u>',
        close: '</u>',
    },
    sub: {
        open: '<sub>',
        close: '</sub>',
    },
    sup: {
        open: '<sup>',
        close: '</sup>',
    },
    mark: {
        open: '<mark>',
        close: '</mark>',
    },
};

export const FORMAT_TYPES = [
    'strong',
    'em',
    'del',
    'inline_code',
    'link',
    'image',
    'inline_math',
];

export const PARAGRAPH_STATE = {
    name: 'paragraph',
    text: 'paragraph example',
};

export const THEMATIC_BREAK_STATE = {
    name: 'thematic-break',
    text: '---',
};

export const EVENT_KEYS = generateKeyHash([
    'Enter',
    'Backspace',
    'Space',
    'Delete',
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'Tab',
    'Escape',
]);

// TODO remove unused classnames after muya stable.
export const CLASS_NAMES = genUpper2LowerKeyHash([
    'MU_EDITOR',
    'MU_ACTIVE',
    'MU_AUTO_LINK',
    'MU_AUTO_LINK_EXTENSION',
    'MU_BACKLASH',
    'MU_BUG',
    'MU_BULLET_LIST',
    'MU_BULLET_LIST_ITEM',
    'MU_CHECKBOX_CHECKED',
    'MU_CONTAINER_BLOCK',
    'MU_CONTAINER_PREVIEW',
    'MU_CONTAINER_ICON',
    'MU_COPY_REMOVE',
    'MU_DISABLE_HTML_RENDER',
    'MU_EMOJI_MARKED_TEXT',
    'MU_EMOJI_MARKER',
    'MU_EMPTY',
    'MU_FENCE_CODE',
    'MU_FOCUS_MODE',
    'MU_FRONT_MATTER',
    'MU_FRONT_ICON',
    'MU_GRAY',
    'MU_HARD_LINE_BREAK',
    'MU_HARD_LINE_BREAK_SPACE',
    'MU_LINE_END',
    'MU_HEADER_TIGHT_SPACE',
    'MU_HIDE',
    'MU_HIGHLIGHT',
    'MU_HTML_BLOCK',
    'MU_HTML_ESCAPE',
    'MU_HTML_PREVIEW',
    'MU_HTML_TAG',
    'MU_IMAGE_FAIL',
    'MU_IMAGE_BUTTONS',
    'MU_IMAGE_LOADING',
    'MU_EMPTY_IMAGE',
    'MU_IMAGE_MARKED_TEXT',
    'MU_IMAGE_SRC',
    'MU_IMAGE_CONTAINER',
    'MU_INLINE_IMAGE',
    'MU_IMAGE_SUCCESS',
    'MU_IMAGE_UPLOADING',
    'MU_INLINE_IMAGE_SELECTED',
    'MU_INLINE_IMAGE_IS_EDIT',
    'MU_INDENT_CODE',
    'MU_INLINE_FOOTNOTE_IDENTIFIER',
    'MU_INLINE_RULE',
    'MU_LANGUAGE',
    'MU_LANGUAGE_INPUT',
    'MU_LINK',
    'MU_LINK_IN_BRACKET',
    'MU_LIST_ITEM',
    'MU_LOOSE_LIST_ITEM',
    'MU_MATH',
    'MU_MATH_TEXT',
    'MU_MATH_RENDER',
    'MU_RUBY',
    'MU_RUBY_TEXT',
    'MU_RUBY_RENDER',
    'MU_SELECTED',
    'MU_SOFT_LINE_BREAK',
    'MU_MATH_ERROR',
    'MU_MATH_MARKER',
    'MU_MATH_RENDER',
    'MU_MATH_TEXT',
    'MU_MERMAID',
    'MU_MULTIPLE_MATH',
    'MU_NO_TEXT_LINK',
    'MU_ORDER_LIST',
    'MU_ORDER_LIST_ITEM',
    'MU_OUTPUT_REMOVE',
    'MU_PARAGRAPH',
    'MU_RAW_HTML',
    'MU_REFERENCE_LABEL',
    'MU_REFERENCE_LINK',
    'MU_REFERENCE_MARKER',
    'MU_REFERENCE_TITLE',
    'MU_REMOVE',
    'MU_RUBY',
    'MU_RUBY_RENDER',
    'MU_RUBY_TEXT',
    'MU_SELECTION',
    'MU_SHOW_PREVIEW',
    'MU_SOFT_LINE_BREAK',
    'MU_TASK_LIST',
    'MU_TASK_LIST_ITEM',
    'MU_TASK_LIST_ITEM_CHECKBOX',
    'MU_TIGHT_LIST_ITEM',
    'MU_TOOL_BAR',
    'MU_VEGA_LITE',
    'MU_WARN',
    'MU_SHOW_QUICK_INSERT_HINT',
]);

export const PARAGRAPH_TYPES = [
    'p',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'blockquote',
    'pre',
    'ul',
    'ol',
    'li',
    'figure',
];

export const BLOCK_TYPE6 = [
    'address',
    'article',
    'aside',
    'base',
    'basefont',
    'blockquote',
    'body',
    'caption',
    'center',
    'col',
    'colgroup',
    'dd',
    'details',
    'dialog',
    'dir',
    'div',
    'dl',
    'dt',
    'fieldset',
    'figcaption',
    'figure',
    'footer',
    'form',
    'frame',
    'frameset',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'head',
    'header',
    'hr',
    'html',
    'iframe',
    'legend',
    'li',
    'link',
    'main',
    'menu',
    'menuitem',
    'meta',
    'nav',
    'noframes',
    'ol',
    'optgroup',
    'option',
    'p',
    'param',
    'section',
    'source',
    'summary',
    'table',
    'tbody',
    'td',
    'tfoot',
    'th',
    'thead',
    'title',
    'tr',
    'track',
    'ul',
];

export const BRACKET_HASH: Record<string, string> = {
    '{': '}',
    '[': ']',
    '(': ')',
    '*': '*',
    '_': '_',
    '"': '"',
    '\'': '\'',
    '$': '$',
    '~': '~',
};

export const BACK_HASH: Record<string, string> = {
    '}': '{',
    ']': '[',
    ')': '(',
    '*': '*',
    '_': '_',
    '"': '"',
    '\'': '\'',
    '$': '$',
    '~': '~',
};

export const MUYA_DEFAULT_OPTIONS = {
    fontSize: 16,
    lineHeight: 1.6,
    focusMode: false,
    markdown: '',
    // Whether to trim the beginning and ending empty line in code block when open markdown.
    trimUnnecessaryCodeBlockEmptyLines: false,
    preferLooseListItem: true,
    autoPairBracket: true,
    autoPairMarkdownSyntax: true,
    autoPairQuote: true,
    bulletListMarker: '-',
    orderListDelimiter: '.',
    tabSize: 4,
    codeBlockLineNumbers: false,
    // bullet/list marker width + listIndentation, tab or Daring Fireball Markdown (4 spaces) --> list indentation
    listIndentation: 1,
    frontmatterType: '-',
    mermaidTheme: 'default', // dark / forest / default
    vegaTheme: 'latimes', // excel / ggplot2 / quartz / vox / fivethirtyeight / dark / latimes
    hideQuickInsertHint: false,
    hideLinkPopup: false,
    autoCheck: false,
    // Whether we should set spellcheck attribute on our container to highlight misspelled words.
    // NOTE: The browser is not able to correct misspelled words words without a custom
    // implementation like in MarkText.
    spellcheckEnabled: false,
    // Markdown extensions
    frontMatter: true, // Whether to support frontmatter.
    superSubScript: true,
    footnote: false,
    // Whether math block is supported.
    math: true,
    isGitlabCompatibilityEnabled: true,
    // Move checked task list item to the end of task list.
    autoMoveCheckedToEnd: false,
    // Whether HTML rendering is disabled or not.
    disableHtml: false,
    locale: en,
};

export const punctuation = [
    '!',
    '"',
    '#',
    '$',
    '%',
    '&',
    '\'',
    '(',
    ')',
    '*',
    '+',
    ',',
    '-',
    '.',
    '/',
    ':',
    ';',
    '<',
    '=',
    '>',
    '?',
    '@',
    '[',
    '\\',
    ']',
    '^',
    '_',
    '`',
    '{',
    '|',
    '}',
    '~',
];
// export const isInElectron = (window.process as any)?.type === "renderer";
export const IMAGE_EXT_REG = /\.(jpeg|jpg|png|gif|svg|webp)(?=\?|$)/i;
export const isFirefox = (navigator.userAgent.includes('Firefox'));
export const isOsx
  = window && window.navigator && /Mac/.test(window.navigator.userAgent);
export const isWin
  = window
  && window.navigator.userAgent
  && /win32|wow32|win64|wow64/i.test(window.navigator.userAgent);
// http[s] (domain or IPv4 or localhost or IPv6) [port] /not-white-space
export const URL_REG
  = /^http(s)?:\/\/([a-z0-9\-._~]+\.[a-z]{2,}|[0-9.]+|localhost|\[[a-f0-9.:]+\])(:[0-9]{1,5})?\/[\S]+/i;
export const PREVIEW_DOMPURIFY_CONFIG = {
    // do not forbid `class` because `code` element use class to present language
    FORBID_ATTR: ['style', 'contenteditable'],
    ALLOW_DATA_ATTR: false,
    USE_PROFILES: {
        html: true,
        svg: true,
        svgFilters: true,
        mathMl: false,
    },
    RETURN_TRUSTED_TYPE: false,
};
export const EXPORT_DOMPURIFY_CONFIG = {
    FORBID_ATTR: ['contenteditable'],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['data-align'],
    USE_PROFILES: {
        html: true,
        svg: true,
        svgFilters: true,
        mathMl: false,
    },
    RETURN_TRUSTED_TYPE: false,
    // Allow "file" protocol to export images on Windows (#1997).
    ALLOWED_URI_REGEXP:
    /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|file):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
};
export const DEFAULT_SEARCH_OPTIONS = {
    isCaseSensitive: false,
    isWholeWord: false,
    isRegexp: false,
    selectHighlight: false,
    highlightIndex: -1,
};

export const LINE_BREAK = '\n';

export const DEFAULT_TURNDOWN_CONFIG = {
    headingStyle: 'atx', // setext or atx
    hr: '---',
    bulletListMarker: '-', // -, +, or *
    codeBlockStyle: 'fenced', // fenced or indented
    fence: '```', // ``` or ~~~
    emDelimiter: '*', // _ or *
    strongDelimiter: '**', // ** or __
    linkStyle: 'inlined',
    linkReferenceStyle: 'full',
    blankReplacement(_content: unknown, node: any, _options: unknown) {
        if (node && node.classList.contains('mu-soft-line-break'))
            return LINE_BREAK;
        else if (node && node.classList.contains('mu-hard-line-break'))
            return `  ${LINE_BREAK}`;
        else if (node && node.classList.contains('mu-hard-line-break-space'))
            return '';
        else
            return node.isBlock ? '\n\n' : '';
    },
};
