/* eslint-disable no-fallthrough */
import ScrollPage from '../../block';
import Content from '../../block/base/content';
import {
    CLASS_NAMES,
    FORMAT_MARKER_MAP,
    FORMAT_TAG_MAP,
    FORMAT_TYPES,
    PARAGRAPH_STATE,
    THEMATIC_BREAK_STATE,
} from '../../config';
import { generator, tokenizer } from '../../inlineRenderer/lexer';
import type {
    CodeEmojiMathToken,
    TextToken,
    Token,
} from '../../inlineRenderer/types';
import Selection from '../../selection';
import { getTextContent } from '../../selection/dom';
import type { ICursor } from '../../selection/types';
import type { IBulletListState, IOrderListState } from '../../state/types';
import { conflict, getCursorReference, isMouseEvent } from '../../utils';
import type { IImageInfo } from '../../utils/image';
import { correctImageSrc, getImageInfo } from '../../utils/image';
import logger from '../../utils/logger';
import type AtxHeading from '../commonMark/atxHeading';
import type BulletList from '../commonMark/bulletList';
import type SetextHeading from '../commonMark/setextHeading';
import type Parent from './parent';

interface IOffset {
    offset: number;
}

interface IOffsetWithDelta extends IOffset {
    delta: number;
}

const debug = logger('block.format:');

function isEmojiToken(token: Token): token is CodeEmojiMathToken {
    return token.type === 'emoji';
}

const INLINE_UPDATE_FRAGMENTS = [
    '(?:^|\n) {0,3}([*+-] {1,4})', // Bullet list
    '^(\\[[x ]{1}\\] {1,4})', // Task list **match from beginning**
    '(?:^|\n) {0,3}(\\d{1,9}(?:\\.|\\)) {1,4})', // Order list
    '(?:^|\n) {0,3}(#{1,6})(?=\\s{1,}|$)', // ATX headings
    '^(?:[\\s\\S]+?)\\n {0,3}(\\={3,}|\\-{3,})(?= {1,}|$)', // Setext headings **match from beginning**
    '(?:^|\n) {0,3}(>).+', // Block quote
    '^( {4,})', // Indent code **match from beginning**
    // '^(\\[\\^[^\\^\\[\\]\\s]+?(?<!\\\\)\\]: )', // Footnote **match from beginning**
    '(?:^|\n) {0,3}((?:\\* *\\* *\\*|- *- *-|_ *_ *_)[ \\*\\-\\_]*)(?=\n|$)', // Thematic break
];

const INLINE_UPDATE_REG = new RegExp(INLINE_UPDATE_FRAGMENTS.join('|'), 'i');

function getOffset(offset: number, token: Token) {
    const {
        range: { start, end },
        type,
    } = token;
    const dis = offset - start;
    const len = end - start;

    switch (type) {
        case 'strong':

        case 'del':

        case 'em':

        case 'inline_code':

        case 'inline_math': {
            const MARKER_LEN = type === 'strong' || type === 'del' ? 2 : 1;
            if (dis < 0)
                return 0;
            if (dis >= 0 && dis < MARKER_LEN)
                return -dis;
            if (dis >= MARKER_LEN && dis <= len - MARKER_LEN)
                return -MARKER_LEN;
            if (dis > len - MARKER_LEN && dis <= len)
                return len - dis - 2 * MARKER_LEN;
            if (dis > len)
                return -2 * MARKER_LEN;

            break;
        }

        case 'html_tag': {
            const { tag } = token;
            // handle underline, sup, sub
            const OPEN_MARKER_LEN = FORMAT_TAG_MAP[tag].open.length;
            const CLOSE_MARKER_LEN = FORMAT_TAG_MAP[tag].close.length;

            if (dis < 0)
                return 0;
            if (dis >= 0 && dis < OPEN_MARKER_LEN)
                return -dis;
            if (dis >= OPEN_MARKER_LEN && dis <= len - CLOSE_MARKER_LEN)
                return -OPEN_MARKER_LEN;
            if (dis > len - CLOSE_MARKER_LEN && dis <= len)
                return len - dis - OPEN_MARKER_LEN - CLOSE_MARKER_LEN;
            if (dis > len)
                return -OPEN_MARKER_LEN - CLOSE_MARKER_LEN;

            break;
        }

        case 'link': {
            const { anchor } = token;
            const MARKER_LEN = 1;

            if (dis < MARKER_LEN)
                return 0;
            if (dis >= MARKER_LEN && dis <= MARKER_LEN + anchor.length)
                return -1;
            if (dis > MARKER_LEN + anchor.length)
                return anchor.length - dis;

            break;
        }

        case 'image': {
            const { alt } = token;
            const MARKER_LEN = 1;

            if (dis < MARKER_LEN)
                return 0;
            if (dis >= MARKER_LEN && dis < MARKER_LEN * 2)
                return -1;
            if (dis >= MARKER_LEN * 2 && dis <= MARKER_LEN * 2 + alt.length)
                return -2;
            if (dis > MARKER_LEN * 2 + alt.length)
                return alt.length - dis;

            break;
        }
    }
}

function clearFormat(token: Token, cursor: ICursor) {
    switch (token.type) {
        case 'strong':

        case 'del':

        case 'em':

        case 'link':

        case 'html_tag': {
            // underline, sub, sup
            const { parent, children } = token;
            const index = parent.indexOf(token);
            parent.splice(index, 1, ...(children as Token[]));

            break;
        }

        case 'image': {
            const { parent, range } = token;
            const index = parent.indexOf(token);
            const newToken: TextToken = {
                type: 'text',
                raw: token.alt,
                content: token.alt, // maybe src is better?
                parent,
                range, // the range is wrong, but it will not be used.
            };

            parent.splice(index, 1, newToken);

            break;
        }

        case 'inline_math':

        case 'inline_code': {
            const { parent, range } = token;
            const index = parent.indexOf(token);
            const newToken: TextToken = {
                type: 'text',
                raw: token.content,
                content: token.content,
                parent,
                range, // the range is wrong, but it will not be used.
            };

            parent.splice(index, 1, newToken);

            break;
        }
    }

    const start = cursor.start as IOffsetWithDelta;
    const end = cursor.end as IOffsetWithDelta;

    if (start) {
        const deltaStart = getOffset(start.offset, token)!;
        start.delta += deltaStart;
    }

    if (end) {
        const deltaEnd = getOffset(end.offset, token)!;
        end.delta += deltaEnd;
    }
}

function checkTokenIsInlineFormat(token: Token) {
    const { type } = token;

    if (FORMAT_TYPES.includes(type))
        return true;

    if (type === 'html_tag')
        return /^(?:u|sub|sup|mark)$/i.test(token.tag);

    return false;
}

class Format extends Content {
    static override blockName = 'format';

    private _checkCursorInTokenType(
        text: string,
        offset: number,
        type: Token['type'],
    ): Token | null {
        const tokens = tokenizer(text, {
            hasBeginRules: false,
            options: this.muya.options,
        });

        let result = null;

        const travel = (tokens: Token[]) => {
            for (const token of tokens) {
                if (token.range.start > offset)
                    break;

                if (
                    token.type === type
                    && offset > token.range.start
                    && offset < token.range.end
                ) {
                    result = token;
                    break;
                }
                else if ('children' in token && Array.isArray(token.children)) {
                    travel(token.children);
                }
            }
        };

        travel(tokens);

        return result;
    }

    private _checkNotSameToken(oldText: string, text: string) {
        const { options } = this.muya;
        const oldTokens = tokenizer(oldText, {
            options,
        });
        const tokens = tokenizer(text, {
            options,
        });

        const oldCache: Record<string, number> = {};
        const cache: Record<string, number> = {};

        for (const { type } of oldTokens) {
            if (oldCache[type])
                oldCache[type]++;
            else
                oldCache[type] = 1;
        }

        for (const { type } of tokens) {
            if (cache[type])
                cache[type]++;
            else
                cache[type] = 1;
        }

        if (Object.keys(oldCache).length !== Object.keys(cache).length)
            return true;

        for (const key of Object.keys(oldCache)) {
            if (!cache[key] || oldCache[key] !== cache[key])
                return true;
        }

        return false;
    }

    // TODO: @JOCS remove use this.selection directly
    checkNeedRender(cursor: ICursor = this.selection as ICursor) {
        const { labels } = this.inlineRenderer;
        const { text } = this;
        const { start: cStart, end: cEnd, anchor, focus } = cursor;
        const anchorOffset = cStart ? cStart.offset : anchor!.offset;
        const focusOffset = cEnd ? cEnd.offset : focus!.offset;
        const NO_NEED_TOKEN_REG = /text|hard_line_break|soft_line_break/;

        for (const token of tokenizer(text, {
            labels,
            options: this.muya.options,
        })) {
            if (NO_NEED_TOKEN_REG.test(token.type))
                continue;

            const { start, end } = token.range;
            const textLen = text.length;

            if (
                conflict(
                    [Math.max(0, start - 1), Math.min(textLen, end + 1)],
                    [anchorOffset, anchorOffset],
                )
                || conflict(
                    [Math.max(0, start - 1), Math.min(textLen, end + 1)],
                    [focusOffset, focusOffset],
                )
            )
                return true;
        }

        return false;
    }

    override blurHandler() {
        super.blurHandler();
        const needRender = this.checkNeedRender();
        if (needRender)
            this.update();
    }

    /**
     * Update emoji text if cursor is in emoji syntax.
     * @param {string} text emoji text
     */
    setEmoji(text: string) {
    // TODO: @JOCS remove use this.selection directly.
        const { anchor } = this.selection;
        const editEmoji = this._checkCursorInTokenType(
            this.text,
            anchor!.offset,
            'emoji',
        );

        if (editEmoji) {
            const { start, end } = editEmoji.range;
            const oldText = this.text;
            this.text
        = `${oldText.substring(0, start)}:${text}:${oldText.substring(end)}`;
            const offset = start + text.length + 2;
            this.setCursor(offset, offset, true);
        }
    }

    replaceImage({ token }: IImageInfo, { alt = '', src = '', title = '' }) {
        const { type } = token;
        const { start, end } = token.range;
        const oldText = this.text;
        let imageText = '';
        if (type === 'image') {
            imageText = '![';
            if (alt)
                imageText += alt;

            imageText += '](';
            if (src) {
                imageText += src
                    .replace(/ /g, encodeURI(' '))
                    .replace(/#/g, encodeURIComponent('#'));
            }

            if (title)
                imageText += ` "${title}"`;

            imageText += ')';
        }
        else if (type === 'html_tag') {
            const { attrs } = token;
            Object.assign(attrs, { alt, src, title });
            imageText = '<img ';

            for (const attr of Object.keys(attrs)) {
                let value = attrs[attr];
                if (value && attr === 'src')
                    value = correctImageSrc(value);

                imageText += `${attr}="${value}" `;
            }
            imageText = imageText.trim();
            imageText += '>';
        }

        this.text
      = oldText.substring(0, start) + imageText + oldText.substring(end);

        this.update();
    }

    updateImage(
        { imageId, token }: IImageInfo,
        attrName: string,
        attrValue: string,
    ) {
    // inline/left/center/right
        const { start, end } = token.range;
        const oldText = this.text;
        let imageText = '';
        const attrs = Object.assign({}, token.attrs);
        attrs[attrName] = attrValue;

        imageText = '<img ';

        for (const attr of Object.keys(attrs)) {
            let value = attrs[attr];
            if (value && attr === 'src')
                value = correctImageSrc(value);

            imageText += `${attr}="${value}" `;
        }
        imageText = imageText.trim();
        imageText += '>';
        this.text
      = oldText.substring(0, start) + imageText + oldText.substring(end);

        this.update();

        const selector = `#${imageId.includes('_') ? imageId : `${imageId}_${token.range.start}`
      } img`;
        const image: HTMLImageElement | null = document.querySelector(selector);

        if (image)
            image.click();
    }

    deleteImage({ token }: IImageInfo) {
        const oldText = this.text;
        const { start, end } = token.range;
        const { eventCenter } = this.muya;

        this.text = oldText.substring(0, start) + oldText.substring(end);
        this.setCursor(start, start, true);

        // Hide image toolbar and image transformer
        eventCenter.emit('muya-transformer', { reference: null });
        eventCenter.emit('muya-image-toolbar', { reference: null });
    }

    override clickHandler(event: Event): void {
        if (!isMouseEvent(event))
            return;

        // Handler click inline math and inline ruby html.
        const { target } = event;
        const inlineRuleRenderEle
      = (target as HTMLElement).closest(`.${CLASS_NAMES.MU_MATH_RENDER}`)
      || (target as HTMLElement).closest(`.${CLASS_NAMES.MU_RUBY_RENDER}`);

        if (inlineRuleRenderEle)
            return this._handleClickInlineRuleRender(event, inlineRuleRenderEle);

        requestAnimationFrame(() => {
            // TODO: @JOCS, remove use this.selection directly.
            if (event.shiftKey && this.selection.anchorBlock !== this) {
                // TODO: handle select multiple paragraphs
                return;
            }

            const currentCursor = this.getCursor();

            if (!currentCursor)
                return;

            const cursor = Object.assign({}, currentCursor, {
                block: this,
                path: this.path,
            });

            // TODO: The codes bellow maybe is wrong? and remove use this.selection directly
            const needRender
        = this.selection.anchorBlock === this
            ? this.checkNeedRender(cursor) || this.checkNeedRender()
            : this.checkNeedRender(cursor);

            if (needRender)
                this.update(cursor);

            this.selection.setSelection(cursor);

            // Check and show format picker
            if (cursor.start.offset !== cursor.end.offset) {
                const reference = getCursorReference();

                this.muya.eventCenter.emit('muya-format-picker', {
                    reference,
                    block: this,
                });
            }
        });
    }

    override keyupHandler(): void {
        if (this.isComposed)
            return;

        // TODO: @JOCS remove use this.selection directly
        const {
            anchor: oldAnchor,
            focus: oldFocus,
            isSelectionInSameBlock,
        } = this.selection;

        if (!isSelectionInSameBlock)
            return;

        const { anchor, focus } = this.getCursor()!;

        if (
            anchor.offset !== oldAnchor?.offset
            || focus.offset !== oldFocus?.offset
        ) {
            const needUpdate = this.checkNeedRender({ anchor, focus });
            const cursor = { anchor, focus, block: this, path: this.path };

            if (needUpdate)
                this.update(cursor);

            this.selection.setSelection(cursor);
        }

        // Check not edit emoji
        const editEmoji = this._checkCursorInTokenType(
            this.text,
            anchor.offset,
            'emoji',
        );

        if (!editEmoji) {
            this.muya.eventCenter.emit('muya-emoji-picker', {
                emojiText: '',
            });
        }

        // Check and show format picker
        if (anchor.offset !== focus.offset) {
            const reference = getCursorReference();

            this.muya.eventCenter.emit('muya-format-picker', {
                reference,
                block: this,
            });
        }
    }

    override inputHandler(event: Event): void {
    // Do not use `isInputEvent` util, because compositionEnd event also invoke this method.
        if (
            this.isComposed
            || /historyUndo|historyRedo/.test((event as InputEvent).inputType)
        )
            return;

        const { domNode } = this;
        const { start, end } = this.getCursor()!;
        const textContent = getTextContent(domNode!, [
            CLASS_NAMES.MU_MATH_RENDER,
            CLASS_NAMES.MU_RUBY_RENDER,
        ]);
        const isInInlineMath = !!this._checkCursorInTokenType(
            textContent,
            start.offset,
            'inline_math',
        );
        const isInInlineCode = !!this._checkCursorInTokenType(
            textContent,
            start.offset,
            'inline_code',
        );

        let { needRender, text } = this.autoPair(
            event,
            textContent,
            start,
            end,
            isInInlineMath,
            isInInlineCode,
            'format',
        );

        if (this._checkNotSameToken(this.text, text))
            needRender = true;

        this.text = text;

        const cursor = {
            path: this.path,
            block: this,
            anchor: {
                offset: start.offset,
            },
            focus: {
                offset: end.offset,
            },
        };

        const checkMarkedUpdate = this.checkNeedRender(cursor);

        if (checkMarkedUpdate || needRender)
            this.update(cursor);

        this.selection.setSelection(cursor);
        // check edit emoji
        if (
            (event as InputEvent).inputType !== 'insertFromPaste'
            && (event as InputEvent).inputType !== 'deleteByCut'
        ) {
            const emojiToken = this._checkCursorInTokenType(
                this.text,
                start.offset,
                'emoji',
            );
            if (emojiToken && isEmojiToken(emojiToken)) {
                const { content: emojiText } = emojiToken;
                const reference = getCursorReference();

                this.muya.eventCenter.emit('muya-emoji-picker', {
                    reference,
                    emojiText,
                    block: this,
                });
            }
        }

        // Check block convert if needed, and table cell no need to check.
        if (this.blockName !== 'table.cell.content')
            this._convertIfNeeded();
    }

    private _convertIfNeeded() {
        const { text } = this;

        const [
            match,
            bulletList,
            taskList,
            orderList,
            atxHeading,
            setextHeading,
            blockquote,
            indentedCodeBlock,
            thematicBreak,
        ] = text.match(INLINE_UPDATE_REG) || [];

        switch (true) {
            case !!thematicBreak
                && new Set(thematicBreak.split('').filter(i => /\S/.test(i))).size === 1:
                this._convertToThematicBreak();
                break;

            case !!bulletList:
                this._convertToList();
                break;

            case !!orderList:
                this._convertToList();
                break;

            case !!taskList:
                this.convertToTaskList();
                break;

            case !!atxHeading:
                this._convertToAtxHeading(atxHeading);
                break;

            case !!setextHeading:
                this._convertToSetextHeading(setextHeading);
                break;

            case !!blockquote:
                this._convertToBlockQuote();
                break;

            case !!indentedCodeBlock:
                this._convertToIndentedCodeBlock();
                break;

            case !match:
            default:
                this.convertToParagraph();
                break;
        }
    }

    // Thematic Break
    private _convertToThematicBreak() {
    // If the block is already thematic break, no need to update.
        if (this.parent?.blockName === 'thematic-break')
            return;

        const { hasSelection } = this;
        const { start, end } = this.getCursor()!;
        const { text, muya } = this;
        const lines = text.split('\n');
        const preParagraphLines = [];
        let thematicLine = '';
        const postParagraphLines = [];
        let thematicLineHasPushed = false;

        for (const l of lines) {
            const THEMATIC_BREAK_REG

        = / {0,3}(?:\* *\* *\*|- *- *-|_ *_ *_)[ \*\-\_]*$/;
            if (THEMATIC_BREAK_REG.test(l) && !thematicLineHasPushed) {
                thematicLine = l;
                thematicLineHasPushed = true;
            }
            else if (!thematicLineHasPushed) {
                preParagraphLines.push(l);
            }
            else {
                postParagraphLines.push(l);
            }
        }

        const newNodeState = Object.assign({}, THEMATIC_BREAK_STATE, {
            text: thematicLine,
        });

        if (preParagraphLines.length) {
            const preParagraphState = Object.assign({}, PARAGRAPH_STATE, {
                text: preParagraphLines.join('\n'),
            });
            const preParagraphBlock = ScrollPage.loadBlock(
                preParagraphState.name,
            ).create(muya, preParagraphState);
            this.parent!.parent!.insertBefore(preParagraphBlock, this.parent);
        }

        if (postParagraphLines.length) {
            const postParagraphState = Object.assign({}, PARAGRAPH_STATE, {
                text: postParagraphLines.join('\n'),
            });
            const postParagraphBlock = ScrollPage.loadBlock(
                postParagraphState.name,
            ).create(muya, postParagraphState);
            this.parent!.parent!.insertAfter(postParagraphBlock, this.parent);
        }

        const thematicBlock = ScrollPage.loadBlock(newNodeState.name).create(
            muya,
            newNodeState,
        );

        this.parent!.replaceWith(thematicBlock);

        if (hasSelection) {
            const thematicBreakContent = thematicBlock.children.head;
            const preParagraphTextLength = preParagraphLines.reduce(
                (acc, i) => acc + i.length + 1,
                0,
            ); // Add one, because the `\n`
            const startOffset = Math.max(0, start.offset - preParagraphTextLength);
            const endOffset = Math.max(0, end.offset - preParagraphTextLength);

            thematicBreakContent.setCursor(startOffset, endOffset, true);
        }
    }

    private _convertToList() {
        const { text, parent, muya, hasSelection } = this;
        const { preferLooseListItem } = muya.options;
        const matches = text.match(
            /^([\s\S]*?) {0,3}([*+-]|\d{1,9}(?:\.|\))) {1,4}([\s\S]*)$/,
        );
        const blockName = /\d/.test(matches![2]) ? 'order-list' : 'bullet-list';

        if (matches![1]) {
            const paragraphState = {
                name: 'paragraph',
                text: matches![1].trim(),
            };
            const paragraph = ScrollPage.loadBlock(paragraphState.name).create(
                muya,
                paragraphState,
            );
            parent!.parent!.insertBefore(paragraph, parent);
        }

        const listState = {
            name: blockName,
            meta: {
                loose: preferLooseListItem,
            },
            children: [
                {
                    name: 'list-item',
                    children: [
                        {
                            name: 'paragraph',
                            text: matches![3],
                        },
                    ],
                },
            ],
        };

        if (blockName === 'order-list') {
            (listState as IOrderListState).meta.delimiter = matches![2].slice(-1);
            (listState as IOrderListState).meta.start = Number(
                matches![2].slice(0, -1),
            );
        }
        else {
            (listState as IBulletListState).meta.marker = matches![2];
        }

        const list = ScrollPage.loadBlock(listState.name).create(muya, listState);
        parent!.replaceWith(list);

        const firstContent = list.firstContentInDescendant();

        if (hasSelection)
            firstContent.setCursor(0, 0, true);

        // convert `[*-+] \[[xX ]\] ` to task list.
        const TASK_LIST_REG = /^\[[x ]\] {1,4}/i;
        if (TASK_LIST_REG.test(firstContent.text))
            firstContent.convertToTaskList();
    }

    convertToTaskList() {
        const { text, parent, muya, hasSelection } = this;
        const { preferLooseListItem } = muya.options;
        const listItem = parent!.parent!;
        const list = listItem?.parent as BulletList;
        const matches = text.match(/^\[([x ]{1})\] {1,4}([\s\S]*)$/i);

        if (
            !list
            || list.blockName !== 'bullet-list'
            || !parent!.isFirstChild()
            || matches == null
        )
            return;

        const listState = {
            name: 'task-list',
            meta: {
                loose: preferLooseListItem,
                marker: list.meta.marker,
            },
            children: [
                {
                    name: 'task-list-item',
                    meta: {
                        checked: matches[1] !== ' ',
                    },
                    children: listItem.map((node) => {
                        if (node === parent) {
                            return {
                                name: 'paragraph',
                                text: matches[2],
                            };
                        }
                        else {
                            return (node as any).getState();
                        }
                    }),
                },
            ],
        };

        const newTaskList = ScrollPage.loadBlock(listState.name).create(
            muya,
            listState,
        );

        switch (true) {
            case listItem.isOnlyChild():
                list.replaceWith(newTaskList);
                break;

            case listItem.isFirstChild():
                list.parent!.insertBefore(newTaskList, list);
                listItem.remove();
                break;

            case listItem.isLastChild():
                list.parent!.insertAfter(newTaskList, list);
                listItem.remove();
                break;

            default: {
                const bulletListState: IBulletListState = {
                    name: 'bullet-list',
                    meta: {
                        loose: preferLooseListItem,
                        marker: list.meta.marker,
                    },
                    children: [],
                };
                const offset = list.offset(listItem);
                list.forEachAt(offset + 1, undefined, (node) => {
                    bulletListState.children.push((node as any).getState());
                    (node as Parent).remove();
                });

                const bulletList = ScrollPage.loadBlock(bulletListState.name).create(
                    muya,
                    bulletListState,
                );
                list.parent!.insertAfter(newTaskList, list);
                newTaskList.parent.insertAfter(bulletList, newTaskList);
                listItem.remove();
                break;
            }
        }

        if (hasSelection)
            newTaskList.firstContentInDescendant().setCursor(0, 0, true);
    }

    // ATX Heading
    private _convertToAtxHeading(atxHeading: string) {
        const level = atxHeading.length;
        if (
            this.parent!.blockName === 'atx-heading'
            && (this.parent as AtxHeading).meta.level === level
        )
            return;

        const { hasSelection } = this;
        const { start, end } = this.getCursor()!;
        const { text, muya } = this;
        const lines = text.split('\n');
        const preParagraphLines = [];
        let atxLine = '';
        const postParagraphLines = [];
        let atxLineHasPushed = false;

        for (const l of lines) {
            if (/^ {0,3}#{1,6}(?=\s{1,}|$)/.test(l) && !atxLineHasPushed) {
                atxLine = l;
                atxLineHasPushed = true;
            }
            else if (!atxLineHasPushed) {
                preParagraphLines.push(l);
            }
            else {
                postParagraphLines.push(l);
            }
        }

        if (preParagraphLines.length) {
            const preParagraphState = {
                name: 'paragraph',
                text: preParagraphLines.join('\n'),
            };
            const preParagraphBlock = ScrollPage.loadBlock(
                preParagraphState.name,
            ).create(muya, preParagraphState);
            this.parent!.parent!.insertBefore(preParagraphBlock, this.parent);
        }

        if (postParagraphLines.length) {
            const postParagraphState = {
                name: 'paragraph',
                text: postParagraphLines.join('\n'),
            };
            const postParagraphBlock = ScrollPage.loadBlock(
                postParagraphState.name,
            ).create(muya, postParagraphState);
            this.parent!.parent!.insertAfter(postParagraphBlock, this.parent);
        }

        const newNodeState = {
            name: 'atx-heading',
            meta: {
                level,
            },
            text: atxLine,
        };

        const atxHeadingBlock = ScrollPage.loadBlock(newNodeState.name).create(
            muya,
            newNodeState,
        );

        this.parent!.replaceWith(atxHeadingBlock);

        if (hasSelection) {
            const atxHeadingContent = atxHeadingBlock.children.head;
            const preParagraphTextLength = preParagraphLines.reduce(
                (acc, i) => acc + i.length + 1,
                0,
            ); // Add one, because the `\n`
            const startOffset = Math.max(0, start.offset - preParagraphTextLength);
            const endOffset = Math.max(0, end.offset - preParagraphTextLength);
            atxHeadingContent.setCursor(startOffset, endOffset, true);
        }
    }

    // Setext Heading
    private _convertToSetextHeading(setextHeading: string) {
        const level = /=/.test(setextHeading) ? 2 : 1;
        if (
            this.parent?.blockName === 'setext-heading'
            && (this.parent as SetextHeading).meta.level === level
        )
            return;

        const { hasSelection } = this;
        const { text, muya } = this;
        const lines = text.split('\n');
        const setextLines = [];
        const postParagraphLines = [];
        let setextLineHasPushed = false;

        for (const l of lines) {
            if (/^ {0,3}(?:={3,}|-{3,})(?= {1,}|$)/.test(l) && !setextLineHasPushed)
                setextLineHasPushed = true;
            else if (!setextLineHasPushed)
                setextLines.push(l);
            else
                postParagraphLines.push(l);
        }

        const newNodeState = {
            name: 'setext-heading',
            meta: {
                level,
                underline: setextHeading,
            },
            text: setextLines.join('\n'),
        };

        const setextHeadingBlock = ScrollPage.loadBlock(newNodeState.name).create(
            muya,
            newNodeState,
        );

        this.parent!.replaceWith(setextHeadingBlock);

        if (postParagraphLines.length) {
            const postParagraphState = {
                name: 'paragraph',
                text: postParagraphLines.join('\n'),
            };
            const postParagraphBlock = ScrollPage.loadBlock(
                postParagraphState.name,
            ).create(muya, postParagraphState);
            setextHeadingBlock.parent.insertAfter(
                postParagraphBlock,
                setextHeadingBlock,
            );
        }

        if (hasSelection) {
            const cursorBlock = setextHeadingBlock.children.head;
            const offset = cursorBlock.text.length;
            cursorBlock.setCursor(offset, offset, true);
        }
    }

    // Block Quote
    private _convertToBlockQuote() {
        const { text, muya, hasSelection } = this;
        const { start, end } = this.getCursor()!;
        const lines = text.split('\n');
        const preParagraphLines = [];
        const quoteLines = [];
        let quoteLinesHasPushed = false;
        let delta = 0;

        for (const l of lines) {
            if (/^ {0,3}>/.test(l) && !quoteLinesHasPushed) {
                quoteLinesHasPushed = true;
                const tokens = /( *> *)(.*)/.exec(l);
                delta = tokens![1].length;
                quoteLines.push(tokens![2]);
            }
            else if (!quoteLinesHasPushed) {
                preParagraphLines.push(l);
            }
            else {
                quoteLines.push(l);
            }
        }

        let quoteParagraphState;
        if (this.blockName === 'setextheading.content') {
            quoteParagraphState = {
                name: 'setext-heading',
                meta: (this.parent as SetextHeading).meta,
                text: quoteLines.join('\n'),
            };
        }
        else if (this.blockName === 'atxheading.content') {
            quoteParagraphState = {
                name: 'atx-heading',
                meta: (this.parent as AtxHeading).meta,
                text: quoteLines.join(' '),
            };
        }
        else {
            quoteParagraphState = {
                name: 'paragraph',
                text: quoteLines.join('\n'),
            };
        }

        const newNodeState = {
            name: 'block-quote',
            children: [quoteParagraphState],
        };

        const quoteBlock = ScrollPage.loadBlock(newNodeState.name).create(
            muya,
            newNodeState,
        );

        this.parent!.replaceWith(quoteBlock);

        if (preParagraphLines.length) {
            const preParagraphState = {
                name: 'paragraph',
                text: preParagraphLines.join('\n'),
            };
            const preParagraphBlock = ScrollPage.loadBlock(
                preParagraphState.name,
            ).create(muya, preParagraphState);
            quoteBlock.parent.insertBefore(preParagraphBlock, quoteBlock);
        }

        if (hasSelection) {
            // TODO: USE `firstContentInDescendant`
            const cursorBlock = quoteBlock.children.head.children.head;
            cursorBlock.setCursor(
                Math.max(0, start.offset - delta),
                Math.max(0, end.offset - delta),
                true,
            );
        }
    }

    // Indented Code Block
    private _convertToIndentedCodeBlock() {
        const { text, muya, hasSelection } = this;
        const lines = text.split('\n');
        const codeLines = [];
        const paragraphLines = [];
        let canBeCodeLine = true;

        for (const l of lines) {
            if (/^ {4,}/.test(l) && canBeCodeLine) {
                codeLines.push(l.replace(/^ {4}/, ''));
            }
            else {
                canBeCodeLine = false;
                paragraphLines.push(l);
            }
        }

        const codeState = {
            name: 'code-block',
            meta: {
                lang: '',
                type: 'indented',
            },
            text: codeLines.join('\n'),
        };

        const codeBlock = ScrollPage.loadBlock(codeState.name).create(
            muya,
            codeState,
        );
        this.parent!.replaceWith(codeBlock);

        if (paragraphLines.length > 0) {
            const paragraphState = {
                name: 'paragraph',
                text: paragraphLines.join('\n'),
            };
            const paragraphBlock = ScrollPage.loadBlock(paragraphState.name).create(
                muya,
                paragraphState,
            );
            codeBlock.parent.insertAfter(paragraphBlock, codeBlock);
        }

        if (hasSelection) {
            const cursorBlock = codeBlock.lastContentInDescendant();
            cursorBlock.setCursor(0, 0);
        }
    }

    // Paragraph
    convertToParagraph(force = false) {
        if (
            !force
            && (this.parent!.blockName === 'setext-heading'
            || this.parent!.blockName === 'paragraph')
        )
            return;

        const { text, muya, hasSelection } = this;
        const { start, end } = this.getCursor()!;

        const newNodeState = {
            name: 'paragraph',
            text,
        };

        const paragraphBlock = ScrollPage.loadBlock(newNodeState.name).create(
            muya,
            newNodeState,
        );

        this.parent!.replaceWith(paragraphBlock);

        if (hasSelection) {
            const cursorBlock = paragraphBlock.children.head;
            cursorBlock.setCursor(start.offset, end.offset, true);
        }
    }

    override backspaceHandler(event: Event): void {
        const { start, end } = this.getCursor() ?? {};
        // Let input handler to handle this case.
        if (!start || !end || start?.offset !== end?.offset)
            return;

        // fix: #897 in marktext repo
        const { text } = this;
        const { footnote, superSubScript } = this.muya.options;
        const tokens = tokenizer(text, {
            options: { footnote, superSubScript },
        });
        let needRender = false;
        let preToken = null;
        let needSelectImage = false;

        for (const token of tokens) {
            // handle delete the second marker(et:*、$) in inline syntax.(Firefox compatible)
            // Fix: https://github.com/marktext/muya/issues/113
            // for example: foo **strong**|
            if (token.range.end === start.offset) {
                needRender = true;
                token.raw = token.raw.substring(0, token.raw.length - 1);
                break;
            }

            // If preToken is a syntax token, the the cursor is at offset 1, need to set the cursor manually.(Firefox compatible)
            // // Fix: https://github.com/marktext/muya/issues/113
            // for example: foo **strong**w|
            if (token.range.start + 1 === start.offset) {
                needRender = true;
                token.raw = token.raw.substring(1);
                break;
            }

            // handle pre token is a image, need preventdefault.
            if (
                token.range.start + 1 === start.offset
                && preToken
                && preToken.type === 'image'
            ) {
                needSelectImage = true;
                needRender = true;
                token.raw = token.raw.substring(1);
                break;
            }

            preToken = token;
        }

        if (needRender) {
            event.preventDefault();
            this.text = generator(tokens);

            start.offset--;
            end.offset--;
            this.setCursor(start.offset, end.offset, true);
        }

        if (needSelectImage) {
            event.stopPropagation();
            const images: NodeListOf<HTMLImageElement>
        = this.domNode!.querySelectorAll(`.${CLASS_NAMES.MU_INLINE_IMAGE}`);
            const imageWrapper = images[images.length - 1];
            const imageInfo = getImageInfo(imageWrapper);

            this.muya.editor.selection.selectedImage = Object.assign({}, imageInfo, {
                block: this,
            });
            this.muya.editor.activeContentBlock = null;
            this.muya.editor.selection.setSelection({
                anchor: null,
                focus: null,
                block: this,
                path: this.path,
            });
        }
    }

    override deleteHandler(event: KeyboardEvent): void {
        const { start, end } = this.getCursor()!;
        const { text } = this;
        // Let input handler to handle this case.
        if (start.offset !== end.offset || start.offset !== text.length)
            return;

        const nextBlock = this.nextContentInContext();
        if (!nextBlock || nextBlock.blockName !== 'paragraph.content') {
            // If the next block is code content or table cell, nothing need to do.
            event.preventDefault();
            return;
        }

        const paragraphBlock = nextBlock.parent;
        let needRemovedBlock = paragraphBlock;

        while (
            needRemovedBlock
            && needRemovedBlock.isOnlyChild()
            && !needRemovedBlock.isScrollPage
        )
            needRemovedBlock = needRemovedBlock.parent;

        this.text = text + nextBlock.text;
        this.setCursor(start.offset, end.offset, true);
        needRemovedBlock!.remove();
    }

    shiftEnterHandler(event: Event): void {
        event.preventDefault();
        event.stopPropagation();

        const { text: oldText } = this;
        const { start, end } = this.getCursor()!;
        this.text
      = `${oldText.substring(0, start.offset)}\n${oldText.substring(end.offset)}`;
        this.setCursor(start.offset + 1, end.offset + 1, true);
    }

    override enterHandler(event: KeyboardEvent): void {
        event.preventDefault();
        const { text: oldText, muya, parent } = this;
        const { start, end } = this.getCursor()!;
        this.text = oldText.substring(0, start.offset);
        const textOfNewNode = oldText.substring(end.offset);
        const newParagraphState = {
            name: 'paragraph',
            text: textOfNewNode,
        };

        const newNode = ScrollPage.loadBlock(newParagraphState.name).create(
            muya,
            newParagraphState,
        );

        parent!.parent!.insertAfter(newNode, parent);

        this.update();
        const cursorBlock = newNode.firstContentInDescendant();
        cursorBlock.setCursor(0, 0, true);
    }

    getFormatsInRange(cursor = this.getCursor()) {
        if (cursor == null)
            return { formats: [], tokens: [], neighbors: [] };

        const { start, end } = cursor;

        const { text } = this;
        const formats = [];
        const neighbors = [];
        const tokens = tokenizer(text, {
            options: this.muya.options,
        });

        (function iterator(tks) {
            for (const token of tks) {
                if (
                    checkTokenIsInlineFormat(token)
                    && start.offset >= token.range.start
                    && end.offset <= token.range.end
                )
                    formats.push(token);

                if (
                    checkTokenIsInlineFormat(token)
                    && ((start.offset >= token.range.start
                    && start.offset <= token.range.end)
                    || (end.offset >= token.range.start
                    && end.offset <= token.range.end)
                    || (start.offset <= token.range.start
                    && token.range.end <= end.offset))
                )
                    neighbors.push(token);

                if ('children' in token && Array.isArray(token.children))
                    iterator(token.children);
            }
        })(tokens);

        return { formats, tokens, neighbors };
    }

    format(type: string) {
        const cursor = this.getCursor();
        if (cursor == null)
            return;

        const start = cursor.start as IOffsetWithDelta;
        const end = cursor.end as IOffsetWithDelta;

        if (start == null || end == null)
            return debug.warn('You need to special the range you want to format.');

        start.delta = end.delta = 0;
        const { formats, tokens, neighbors } = this.getFormatsInRange(cursor);

        const [currentFormats, currentNeighbors] = [formats, neighbors].map(
            item =>
                item
                    .filter((format) => {
                        return (
                            format.type === type
                            || (format.type === 'html_tag' && format.tag === type)
                        );
                    })
                    .reverse(),
        );

        // cache delta
        if (type === 'clear') {
            for (const neighbor of neighbors)
                clearFormat(neighbor, { start, end });

            start.offset += start.delta;
            end.offset += end.delta;

            this.text = generator(tokens);
        }
        else if (currentFormats.length) {
            for (const token of currentFormats)
                clearFormat(token, { start, end });

            start.offset += start.delta;
            end.offset += end.delta;
            this.text = generator(tokens);
        }
        else {
            if (currentNeighbors.length) {
                for (const neighbor of currentNeighbors)
                    clearFormat(neighbor, { start, end });
            }

            start.offset += start.delta;
            end.offset += end.delta;
            this.text = generator(tokens);

            this._addFormat(type, { start, end });

            if (type === 'image') {
                // Show image selector when create a inline image by menu/shortcut/or just input `![]()`
                requestAnimationFrame(() => {
                    const startNode = Selection.getSelectionStart();

                    if (startNode) {
                        const imageWrapper = (
                            startNode as HTMLElement
                        ).closest('.mu-inline-image') as HTMLElement;

                        if (
                            imageWrapper
                            && imageWrapper.classList.contains('mu-empty-image')
                        ) {
                            const imageInfo = getImageInfo(imageWrapper);
                            const rect = imageWrapper.getBoundingClientRect();

                            const reference = {
                                getBoundingClientRect: () => rect,
                                width: imageWrapper.offsetWidth,
                                height: imageWrapper.offsetHeight,
                            };

                            this.muya.eventCenter.emit('muya-image-selector', {
                                block: this,
                                reference,
                                imageInfo,
                            });
                        }
                    }
                });
            }
        }

        this.setCursor(start.offset, end.offset, true);
    }

    private _addFormat(
        type: string,
        { start, end }: { start: IOffset; end: IOffset },
    ) {
        switch (type) {
            case 'em':

            case 'del':

            case 'inline_code':

            case 'strong':

            case 'inline_math': {
                const MARKER = FORMAT_MARKER_MAP[type];
                const oldText = this.text;
                this.text
          = oldText.substring(0, start.offset)
          + MARKER
          + oldText.substring(start.offset, end.offset)
          + MARKER
          + oldText.substring(end.offset);
                start.offset += MARKER.length;
                end.offset += MARKER.length;
                break;
            }

            case 'sub':

            case 'sup':

            case 'mark':

            case 'u': {
                const MARKER = FORMAT_TAG_MAP[type];
                const oldText = this.text;
                this.text
          = oldText.substring(0, start.offset)
          + MARKER.open
          + oldText.substring(start.offset, end.offset)
          + MARKER.close
          + oldText.substring(end.offset);
                start.offset += MARKER.open.length;
                end.offset += MARKER.open.length;
                break;
            }

            case 'link':

            case 'image': {
                const oldText = this.text;
                const anchorTextLen = end.offset - start.offset;
                this.text
          = `${oldText.substring(0, start.offset)
          + (type === 'link' ? '[' : '![')
          + oldText.substring(start.offset, end.offset)
           }]()${
           oldText.substring(end.offset)}`;
                // put cursor between `()`
                start.offset += type === 'link' ? 3 + anchorTextLen : 4 + anchorTextLen;
                end.offset = start.offset;
                break;
            }
        }
    }

    // Click the rendering of inline syntax, such as Inline Math, and select the math formula.
    private _handleClickInlineRuleRender(
        event: Event,
        inlineRuleRenderEle: Element,
    ) {
        event.preventDefault();
        event.stopPropagation();

        const startOffset = +inlineRuleRenderEle.getAttribute('data-start')!;
        const endOffset = +inlineRuleRenderEle.getAttribute('data-end')!;

        return this.setCursor(startOffset, endOffset, true);
    }
}

export default Format;
