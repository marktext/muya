import type Content from '../../base/content';
import Format from '../../base/format';
import type Parent from '../../base/parent';
import type BulletList from '../../commonMark/bulletList';
import type OrderList from '../../commonMark/orderList';
import type Paragraph from '../../commonMark/paragraph';
import type TaskList from '../../gfm/taskList';
import ScrollPage from '../../scrollPage';
import { HTML_TAGS, VOID_HTML_TAGS } from '../../../config';
import type { Muya } from '../../../index';
import { tokenizer } from '../../../inlineRenderer/lexer';
import type { ImageToken, LinkToken, Token } from '../../../inlineRenderer/types';
import type { ICursor } from '../../../selection/types';
import type { Nullable } from '../../../types';
import { isKeyboardEvent, isLengthEven } from '../../../utils';
import logger from '../../../utils/logger';
import type {
    IBlockQuoteState,
    ITaskListItemState,
} from '../../../state/types';

enum UnindentType {
    INDENT = 'INDENT',
    REPLACEMENT = 'REPLACEMENT',
}

const debug = logger('paragraph:content');

const HTML_BLOCK_REG = /^<([a-zA-Z\d-]+)(?=\s|>)[^<>]*?>$/;

const BOTH_SIDES_FORMATS = [
    'strong',
    'em',
    'inline_code',
    'image',
    'link',
    'reference_image',
    'reference_link',
    'emoji',
    'del',
    'html_tag',
    'inline_math',
];

function parseTableHeader(text: string) {
    const rowHeader = [];
    const len = text.length;
    let i;

    for (i = 0; i < len; i++) {
        const char = text[i];
        if (/^[^|]$/.test(char))
            rowHeader[rowHeader.length - 1] += char;

        if (/\\/.test(char))
            rowHeader[rowHeader.length - 1] += text[++i];

        if (/\|/.test(char) && i !== len - 1)
            rowHeader.push('');
    }

    return rowHeader;
}

/**
 * ParagraphContent
 */
class ParagraphContent extends Format {
    public override parent: Nullable<Paragraph> = null;

    static override blockName = 'paragraph.content';

    static create(muya: Muya, text: string) {
        const content = new ParagraphContent(muya, text);

        return content;
    }

    constructor(muya: Muya, text: string) {
        super(muya, text);

        this.classList = [...this.classList, 'mu-paragraph-content'];
        this.attributes['empty-hint'] = muya.i18n.t('Type / to insert...');
        this.createDomNode();
    }

    override getAnchor() {
        return this.parent;
    }

    override update(cursor?: ICursor, highlights = []) {
        this.inlineRenderer.patch(this, cursor, highlights);
        const { label } = this.inlineRenderer.getLabelInfo(this);

        if (this.scrollPage && label)
            this.scrollPage.updateRefLinkAndImage(label);
    }

    override backspaceHandler(event: Event) {
        const { start, end } = this.getCursor()!;
        const { eventCenter } = this.muya;

        if (start.offset !== 0 || end.offset !== 0) {
            super.backspaceHandler(event);
            eventCenter.emit('content-change', { block: this });
            return;
        }

        event.preventDefault();
        const type = this._paragraphParentType();

        switch (type) {
            case 'paragraph':
                return this._handleBackspaceInParagraph();

            case 'block-quote':
                return this._handleBackspaceInBlockQuote();

            case 'list-item': // fall through
            case 'task-list-item':
                return this._handleBackspaceInList();

            default:
                debug.error('Unknown backspace type');
                break;
        }
    }

    override inputHandler(event: Event) {
        super.inputHandler(event);
        const { eventCenter } = this.muya;

        eventCenter.emit('content-change', { block: this });
    }

    private _enterConvert(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        const TABLE_BLOCK_REG = /^\|.*?(\\*)\|.*?(\\*)\|/;
        const MATH_BLOCK_REG = /^\$\$/;
        const { text } = this;
        const codeBlockToken = text.match(/(^ {0,3}`{3,})([^` ]*)/);
        const tableMatch = TABLE_BLOCK_REG.exec(text);
        const htmlMatch = HTML_BLOCK_REG.exec(text);
        const mathMath = MATH_BLOCK_REG.exec(text);
        const tagName
      = htmlMatch && htmlMatch[1] && HTML_TAGS.find(t => t === htmlMatch[1]);

        if (mathMath) {
            const state = {
                name: 'math-block',
                text: '',
                meta: {
                    mathStyle: '',
                },
            };
            const mathBlock = ScrollPage.loadBlock('math-block').create(
                this.muya,
                state,
            );
            this.parent!.replaceWith(mathBlock);
            mathBlock.firstContentInDescendant().setCursor(0, 0);
        }
        else if (codeBlockToken) {
            // Convert to code block
            const lang = codeBlockToken[2];
            const state = {
                name: 'code-block',
                meta: {
                    lang,
                    type: 'fenced',
                },
                text: '',
            };
            const codeBlock = ScrollPage.loadBlock(state.name).create(
                this.muya,
                state,
            );

            this.parent!.replaceWith(codeBlock);

            codeBlock.lastContentInDescendant().setCursor(0, 0);
        }
        else if (
            tableMatch
            && isLengthEven(tableMatch[1])
            && isLengthEven(tableMatch[2])
        ) {
            const tableHeader = parseTableHeader(this.text);
            const tableBlock = ScrollPage.loadBlock('table').createWithHeader(
                this.muya,
                tableHeader,
            );

            this.parent!.replaceWith(tableBlock);

            // Set cursor at the first cell of second row.
            tableBlock.firstChild
                .find(1)
                .firstContentInDescendant()
                .setCursor(0, 0, true);
        }
        else if (tagName && VOID_HTML_TAGS.every(tag => tag !== tagName)) {
            const state = {
                name: 'html-block',
                text: `<${tagName}>\n\n</${tagName}>`,
            };
            const htmlBlock = ScrollPage.loadBlock('html-block').create(
                this.muya,
                state,
            );
            this.parent!.replaceWith(htmlBlock);
            const offset = tagName.length + 3;
            htmlBlock.firstContentInDescendant().setCursor(offset, offset);
        }
        else {
            return super.enterHandler(event as KeyboardEvent);
        }
    }

    private _enterInBlockQuote(event: Event) {
        const { text, parent } = this;
        if (text.length !== 0)
            return super.enterHandler(event as KeyboardEvent);

        event.preventDefault();
        event.stopPropagation();

        const newNode = parent!.clone() as Paragraph;
        const blockQuote = parent!.parent;

        switch (true) {
            case parent!.isOnlyChild():
                blockQuote!.parent!.insertBefore(newNode, blockQuote);
                blockQuote!.remove();
                break;

            case parent!.isFirstChild():
                blockQuote!.parent!.insertBefore(newNode, blockQuote);
                parent!.remove();
                break;

            case parent!.isLastChild():
                blockQuote!.parent!.insertAfter(newNode, blockQuote);
                parent!.remove();
                break;

            default: {
                const newBlockState: IBlockQuoteState = {
                    name: 'block-quote',
                    children: [],
                };
                const offset = blockQuote!.offset(parent!);
                blockQuote!.forEachAt(offset + 1, undefined, (node) => {
                    newBlockState.children.push((node as any).getState());
                    node.remove();
                });
                const newBlockQuote = ScrollPage.loadBlock(newBlockState.name).create(
                    this.muya,
                    newBlockState,
                );
                blockQuote!.parent!.insertAfter(newNode, blockQuote);
                blockQuote!.parent!.insertAfter(newBlockQuote, newNode);
                parent!.remove();
                break;
            }
        }

        (newNode.children.head as ParagraphContent).setCursor(0, 0, true);
    }

    private _enterInListItem(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        const { text, parent, muya } = this;
        const { start, end } = this.getCursor()!;
        const listItem = parent!.parent!;
        const list = listItem!.parent! as BulletList | OrderList | TaskList;

        if (text.length === 0) {
            if (parent!.isOnlyChild()) {
                switch (true) {
                    case listItem.isOnlyChild(): {
                        const newParagraph = parent!.clone() as Paragraph;
                        list.replaceWith(newParagraph);
                        newParagraph?.firstContentInDescendant()?.setCursor(0, 0);
                        break;
                    }

                    case listItem.isFirstChild(): {
                        const newParagraph = parent!.clone() as Paragraph;
                        listItem.remove();
                        list.parent!.insertBefore(newParagraph, list);
                        newParagraph?.firstContentInDescendant()?.setCursor(0, 0);
                        break;
                    }

                    case listItem.isLastChild(): {
                        const newParagraph = parent!.clone() as Paragraph;
                        listItem.remove();
                        list.parent!.insertAfter(newParagraph, list);
                        newParagraph?.firstContentInDescendant()?.setCursor(0, 0);
                        break;
                    }

                    default: {
                        const newParagraph = parent!.clone() as Paragraph;
                        const newListState = {
                            name: list.blockName,
                            meta: { ...list.meta },
                            children: [] as any,
                        };
                        const offset = list.offset(listItem);
                        list.forEachAt(offset + 1, undefined, (node) => {
                            newListState.children.push((node as any).getState());
                            node.remove();
                        });
                        const newList = ScrollPage.loadBlock(newListState.name).create(
                            this.muya,
                            newListState,
                        );
                        list.parent!.insertAfter(newParagraph, list);
                        list.parent!.insertAfter(newList, newParagraph);
                        listItem.remove();
                        newParagraph?.firstContentInDescendant()?.setCursor(0, 0);
                        break;
                    }
                }
            }
            else {
                const newListItemState = {
                    name: listItem.blockName,
                    children: [] as any,
                };

                if (listItem.blockName === 'task-list-item') {
                    (newListItemState as unknown as ITaskListItemState).meta = {
                        checked: false,
                    };
                }

                const offset = listItem.offset(parent!);
                listItem.forEachAt(offset, undefined, (node) => {
                    newListItemState.children.push((node as any).getState());
                    node.remove();
                });

                const newListItem = ScrollPage.loadBlock(newListItemState.name).create(
                    this.muya,
                    newListItemState,
                );
                list.insertAfter(newListItem, listItem);

                newListItem.firstContentInDescendant().setCursor(0, 0);
            }
        }
        else {
            if (parent!.isOnlyChild()) {
                this.text = text.substring(0, start.offset);
                const newNodeState = {
                    name: listItem.blockName,
                    children: [
                        {
                            name: 'paragraph',
                            text: text.substring(end.offset),
                        },
                    ],
                };

                if (listItem.blockName === 'task-list-item') {
                    (newNodeState as ITaskListItemState).meta = {
                        checked: false,
                    };
                }

                const newListItem = ScrollPage.loadBlock(newNodeState.name).create(
                    muya,
                    newNodeState,
                );

                list.insertAfter(newListItem, listItem);

                this.update();
                newListItem.firstContentInDescendant().setCursor(0, 0, true);
            }
            else {
                super.enterHandler(event as KeyboardEvent);
            }
        }
    }

    override enterHandler(event: Event) {
        if (!isKeyboardEvent(event))
            return;

        if (event.shiftKey)
            return this.shiftEnterHandler(event);

        const type = this._paragraphParentType();

        if (type === 'block-quote')
            this._enterInBlockQuote(event);
        else if (type === 'list-item' || type === 'task-list-item')
            this._enterInListItem(event);
        else
            this._enterConvert(event);
    }

    private _paragraphParentType() {
        if (this.blockName !== 'paragraph.content') {
            debug.warn('Only paragraph content can call _paragraphParentType');

            return;
        }

        let parent: Nullable<Parent> = this.parent;
        let type = 'paragraph';

        while (parent && !parent.isScrollPage) {
            if (
                parent.blockName === 'block-quote'
                || parent.blockName === 'list-item'
                || parent.blockName === 'task-list-item'
            ) {
                type = parent.blockName;
                break;
            }

            parent = parent.parent;
        }

        return type;
    }

    private _handleBackspaceInParagraph(this: ParagraphContent) {
        const previousContentBlock = this.previousContentInContext();
        // Handle no previous content block, the first paragraph in document.
        if (!previousContentBlock)
            return;

        const { text: oldText } = previousContentBlock;
        const offset = oldText.length;
        previousContentBlock.text += this.text;
        this.parent!.remove();
        previousContentBlock.setCursor(offset, offset, true);
    }

    private _handleBackspaceInBlockQuote() {
        const parent = this.parent!;
        const blockQuote = parent!.parent!;
        let cursorBlock: Content | null;

        if (!parent!.isOnlyChild() && !parent!.isFirstChild())
            return this._handleBackspaceInParagraph();

        if (parent.isOnlyChild()) {
            blockQuote.replaceWith(parent);
            cursorBlock = parent.firstContentInDescendant();
        }
        else if (parent.isFirstChild()) {
            const cloneParagraph = parent.clone() as Paragraph;
            blockQuote.parent!.insertBefore(cloneParagraph, blockQuote);
            parent.remove();
            cursorBlock = cloneParagraph.firstContentInDescendant();
        }

        cursorBlock!.setCursor(0, 0, true);
    }

    private _handleBackspaceInList() {
        const parent = this.parent!;
        const listItem = parent.parent!;
        const list = listItem.parent!;

        if (!parent.isFirstChild())
            return this._handleBackspaceInParagraph();

        if (listItem.isOnlyChild()) {
            listItem.forEach((node, i: number) => {
                const paragraph = (node as Parent).clone() as Parent;
                list.parent!.insertBefore(paragraph, list);
                if (i === 0)
                    paragraph?.firstContentInDescendant()?.setCursor(0, 0, true);
            });

            list.remove();
        }
        else if (listItem.isFirstChild()) {
            listItem.forEach((node, i: number) => {
                const paragraph = (node as Parent).clone() as Parent;
                list.parent!.insertBefore(paragraph, list);
                if (i === 0)
                    paragraph?.firstContentInDescendant()?.setCursor(0, 0, true);
            });

            listItem.remove();
        }
        else {
            const previousListItem = listItem.prev;
            listItem.forEach((node, i: number) => {
                const paragraph = (node as Parent).clone() as Parent;
                previousListItem!.append(paragraph, 'user');
                if (i === 0)
                    paragraph?.firstContentInDescendant()?.setCursor(0, 0, true);
            });

            listItem.remove();
        }
    }

    private _getUnindentType(): Nullable<UnindentType> {
        if (!this.isCollapsed)
            return null;

        const { parent } = this;
        const listItem = parent!.parent;
        const list = listItem?.parent;
        const listParent = list?.parent;

        if (
            listParent
            && (listParent.blockName === 'list-item'
            || listParent.blockName === 'task-list-item')
        )
            return list.prev ? UnindentType.INDENT : UnindentType.REPLACEMENT;

        return null;
    }

    private _canIndentListItem() {
        const { parent } = this;
        if (parent!.blockName !== 'paragraph' || !parent!.parent)
            return false;

        const listItem = parent?.parent;
        // Now we know it's a list item. Check whether we can indent the list item.
        const list = listItem?.parent;

        if (listItem == null || list == null)
            return false;

        if (
            (listItem.blockName !== 'list-item'
            && listItem.blockName !== 'task-list-item')
            || !this.isCollapsed
        )
            return false;

        return list && /ol|ul/.test(list.tagName) && listItem.prev;
    }

    private _unindentListItem(type: UnindentType) {
        const { parent } = this;
        const listItem = parent?.parent;
        const list = listItem?.parent;
        const listParent = list?.parent;
        const cursor = this.getCursor();

        if (
            parent == null
            || listItem == null
            || list == null
            || listParent == null
            || cursor == null
        )
            return;

        const { start, end } = cursor;

        const cursorParagraphOffset = listItem.offset(parent);

        if (type === UnindentType.REPLACEMENT) {
            const paragraph = parent.clone() as Paragraph;
            listParent.insertBefore(paragraph, list);

            if (listItem.isOnlyChild())
                list.remove();
            else
                listItem.remove();
        }
        else if (type === UnindentType.INDENT) {
            const newListItem = listItem.clone() as Parent;
            listParent.parent!.insertAfter(newListItem, listParent);

            if (
                (listItem.next || list.next)
                && newListItem.lastChild!.blockName !== list.blockName
            ) {
                const state = {
                    name: list.blockName,
                    meta: { ...(list as any).meta },
                    children: [],
                };
                const childList = ScrollPage.loadBlock(state.name).create(
                    this.muya,
                    state,
                );
                newListItem.append(childList, 'user');
            }

            if (listItem.next) {
                const offset = list.offset(listItem);

                list.forEachAt(offset + 1, undefined, (node) => {
                    (newListItem.lastChild as Parent).append(
                        (node as any).clone(),
                        'user',
                    );
                    node.remove();
                });
            }

            if (list.next) {
                const offset = listParent.offset(list);
                listParent.forEachAt(offset + 1, undefined, (node) => {
                    (newListItem.lastChild as Parent).append(
                        (node as any).clone(),
                        'user',
                    );
                    node.remove();
                });
            }

            if (listItem.isOnlyChild())
                list.remove();
            else
                listItem.remove();

            if (newListItem == null) {
                debug.error('newListItem is null');
                return;
            }

            const cursorBlock = (
                newListItem.find(cursorParagraphOffset) as Parent
            ).firstContentInDescendant();

            cursorBlock?.setCursor(start.offset, end.offset, true);
        }
    }

    private _indentListItem() {
        const { parent, muya } = this;
        const listItem = parent?.parent;
        const list = listItem?.parent;
        const prevListItem = listItem?.prev;
        const { start, end } = this.getCursor()!;

        if (parent == null || listItem == null || list == null)
            return;

        // Remember the offset of cursor paragraph in listItem
        const offset = listItem.offset(parent);

        // Search for a list in previous block
        let newList = prevListItem?.lastChild;

        if (!newList || !/ol|ul/.test(newList.tagName)) {
            const state = {
                name: list.blockName,
                meta: { ...(list as any).meta },
                children: [listItem.getState()],
            };
            newList = ScrollPage.loadBlock(state.name).create(muya, state);
            prevListItem!.append(newList as Parent, 'user');
        }
        else {
            (newList as Parent).append(listItem.clone() as Parent, 'user');
        }

        listItem.remove();

        const cursorBlock = ((newList as Parent).lastChild as any)
            .find(offset)
            .firstContentInDescendant();
        cursorBlock.setCursor(start.offset, end.offset, true);
    }

    override insertTab() {
        const { muya, text } = this;
        const { tabSize } = muya.options;
        const tabCharacter = String.fromCharCode(160).repeat(tabSize);
        const { start, end } = this.getCursor()!;

        if (this.isCollapsed) {
            this.text
        = text.substring(0, start.offset)
        + tabCharacter
        + text.substring(end.offset);
            const offset = start.offset + tabCharacter.length;

            this.setCursor(offset, offset, true);
        }
    }

    private _checkCursorAtEndFormat(): Nullable<{ offset: number }> {
        const { offset } = this.getCursor()!.start;
        // TODO: add labels in tokenizer...
        const { muya, text } = this;
        const tokens = tokenizer(text, {
            hasBeginRules: false,
            options: muya.options,
        });
        let result = null;

        const walkTokens = (ts: Token[]) => {
            for (const token of ts) {
                const { type, range } = token;
                const { start, end } = range;

                if (
                    BOTH_SIDES_FORMATS.includes(type)
                    && offset > start
                    && offset < end
                ) {
                    switch (type) {
                        case 'strong': // fall through

                        case 'em': // fall through

                        case 'inline_code': // fall through

                        case 'emoji': // fall through

                        case 'del': // fall through

                        case 'inline_math': {
                            const { marker } = token;
                            if (marker && offset === end - marker.length) {
                                result = {
                                    offset: marker.length,
                                };

                                return;
                            }

                            break;
                        }

                        case 'image': // fall through

                        case 'link': {
                            const { backlash } = token;
                            const srcAndTitle = (token as ImageToken).srcAndTitle;
                            const hrefAndTitle = (token as LinkToken).hrefAndTitle;
                            const linkTitleLen = (srcAndTitle || hrefAndTitle).length;
                            const secondLashLen
                = backlash && backlash.second ? backlash.second.length : 0;
                            if (offset === end - 3 - (linkTitleLen + secondLashLen)) {
                                result = {
                                    offset: 2,
                                };

                                return;
                            }
                            else if (offset === end - 1) {
                                result = {
                                    offset: 1,
                                };

                                return;
                            }
                            break;
                        }

                        case 'reference_image': // fall through

                        case 'reference_link': {
                            const { backlash, isFullLink, label } = token;
                            const labelLen = label ? label.length : 0;
                            const secondLashLen
                = backlash && backlash.second ? backlash.second.length : 0;
                            if (isFullLink) {
                                if (offset === end - 3 - labelLen - secondLashLen) {
                                    result = {
                                        offset: 2,
                                    };

                                    return;
                                }
                                else if (offset === end - 1) {
                                    result = {
                                        offset: 1,
                                    };

                                    return;
                                }
                            }
                            else if (offset === end - 1) {
                                result = {
                                    offset: 1,
                                };

                                return;
                            }
                            break;
                        }

                        case 'html_tag': {
                            const { closeTag } = token;
                            if (closeTag && offset === end - closeTag.length) {
                                result = {
                                    offset: closeTag.length,
                                };

                                return;
                            }
                            break;
                        }
                        default:
                            break;
                    }
                }

                if ('children' in token && Array.isArray(token.children))
                    walkTokens(token.children);
            }
        };

        walkTokens(tokens);

        return result;
    }

    override tabHandler(event: Event) {
    // disable tab focus
        event.preventDefault();

        if (!isKeyboardEvent(event))
            return;

        const { start, end } = this.getCursor()!;
        if (!start || !end)
            return;

        if (event.shiftKey) {
            const unindentType = this._getUnindentType();

            if (unindentType == null)
                return;

            this._unindentListItem(unindentType);
        }

        // Handle `tab` to jump to the end of format when the cursor is at the end of format content.
        if (this.isCollapsed) {
            const atEnd = this._checkCursorAtEndFormat();

            if (atEnd) {
                const offset = start.offset + atEnd.offset;

                this.setCursor(offset, offset, true);
                return;
            }
        }

        if (this._canIndentListItem()) {
            this._indentListItem();
            return;
        }

        this.insertTab();
    }
}

export default ParagraphContent;
