import { fromEvent, merge } from 'rxjs';
import type Content from '../block/base/content';
import type Parent from '../block/base/parent';
import CodeBlockContent from '../block/content/codeBlockContent';
import { ScrollPage } from '../block/scrollPage';
import { URL_REG } from '../config';
import emptyStates from '../config/emptyStates';
import type { Muya } from '../muya';
import HtmlToMarkdown from '../state/htmlToMarkdown';
import { MarkdownToState } from '../state/markdownToState';
import type { IBlockQuoteState, IParagraphState } from '../state/types';
import { deepClone } from '../utils';
import { getClipBoardHtml } from '../utils/marked';
import { getCopyTextType, normalizePastedHTML } from '../utils/paste';
import StateToMarkdown from '../state/stateToMarkdown';
import type { Nullable } from '../types';

class Clipboard {
    public copyType: string = 'normal'; // `normal` or `copyAsMarkdown` or `copyAsHtml` or `copyCodeContent`
    public pasteType: string = 'normal'; // `normal` or `pasteAsPlainText`
    public copyInfo: string = '';

    get selection() {
        return this.muya.editor.selection;
    }

    get scrollPage() {
        return this.muya.editor.scrollPage;
    }

    static create(muya: Muya) {
        const clipboard = new Clipboard(muya);
        clipboard.listen();

        return clipboard;
    }

    constructor(public muya: Muya) {}

    listen() {
        const { domNode } = this.muya;

        const copyCutHandler = (event: Event) => {
            event.preventDefault();
            event.stopPropagation();

            const isCut = event.type === 'cut';

            this.copyHandler(event as ClipboardEvent);

            if (isCut)
                this.cutHandler();
        };

        const keydownHandler = (event: Event) => {
            const { key, metaKey } = event as KeyboardEvent;

            const { isSelectionInSameBlock } = this.selection.getSelection() ?? {};
            if (isSelectionInSameBlock)
                return;

            // TODO: Is there any way to identify these key bellow?
            if (
                /Alt|Option|Meta|Shift|CapsLock|ArrowUp|ArrowDown|ArrowLeft|ArrowRight/.test(
                    key,
                )
            )
                return;

            if (metaKey)
                return;

            if (key === 'Backspace' || key === 'Delete')
                event.preventDefault();

            this.cutHandler();
        };

        const pasteHandler = (event: Event) => {
            this.pasteHandler(event as ClipboardEvent);
        };

        merge(fromEvent(domNode, 'copy'), fromEvent(domNode, 'cut'))
            .subscribe(copyCutHandler);

        fromEvent(domNode, 'paste').subscribe(pasteHandler);
        fromEvent(domNode, 'keydown').subscribe(keydownHandler);
    }

    getClipboardData() {
        const { copyType, copyInfo } = this;
        if (copyType === 'copyCodeContent') {
            return {
                html: '',
                text: copyInfo,
            };
        }

        let text = '';
        let html = '';

        const selection = this.selection.getSelection();
        if (selection == null) {
            return {
                html,
                text,
            };
        }

        const { isSelectionInSameBlock, anchor, anchorBlock, focus, focusBlock }
      = selection;

        if (anchorBlock == null || focusBlock == null) {
            return {
                html,
                text,
            };
        }

        const {
            frontMatter = true,
            math,
            isGitlabCompatibilityEnabled,
            superSubScript,
        } = this.muya.options;
        // Handler copy/cut in one block.
        if (isSelectionInSameBlock) {
            const begin = Math.min(anchor.offset, focus.offset);
            const end = Math.max(anchor.offset, focus.offset);

            text = anchorBlock.text.substring(begin, end);
            html = getClipBoardHtml(text, {
                frontMatter,
                math,
                isGitlabCompatibilityEnabled,
                superSubScript,
            });

            return { html, text };
        }
        // Handle select multiple blocks.
        const copyState = [];
        const anchorOutMostBlock = anchorBlock.outMostBlock!;
        const focusOutMostBlock = focusBlock.outMostBlock!;
        const anchorOutMostBlockOffset
      = this.scrollPage?.offset(anchorOutMostBlock);
        const focusOutMostBlockOffset = this.scrollPage?.offset(focusOutMostBlock);
        if (anchorOutMostBlockOffset == null || focusOutMostBlockOffset == null) {
            return {
                html,
                text,
            };
        }

        const startOutBlock
      = anchorOutMostBlockOffset <= focusOutMostBlockOffset
          ? anchorOutMostBlock
          : focusOutMostBlock;
        const endOutBlock
      = anchorOutMostBlockOffset <= focusOutMostBlockOffset
          ? focusOutMostBlock
          : anchorOutMostBlock;
        const startBlock
      = anchorOutMostBlockOffset <= focusOutMostBlockOffset
          ? anchorBlock
          : focusBlock;
        const endBlock
      = anchorOutMostBlockOffset <= focusOutMostBlockOffset
          ? focusBlock
          : anchorBlock;
        const startOffset
      = anchorOutMostBlockOffset <= focusOutMostBlockOffset
          ? anchor.offset
          : focus.offset;
        const endOffset
      = anchorOutMostBlockOffset <= focusOutMostBlockOffset
          ? focus.offset
          : anchor.offset;

        const getPartialState = (position: 'start' | 'end') => {
            const outBlock = position === 'start' ? startOutBlock : endOutBlock;
            const block = position === 'start' ? startBlock : endBlock;
            // Handle anchor and focus in different blocks
            if (
                /block-quote|code-block|html-block|table|math-block|frontmatter|diagram/.test(
                    outBlock!.blockName,
                )
            ) {
                copyState.push((outBlock as Parent).getState());
            }
            else if (/bullet-list|order-list|task-list/.test(outBlock!.blockName)) {
                const listItemBlockName
          = outBlock!.blockName === 'task-list' ? 'task-list-item' : 'list-item';
                const listItem = block.farthestBlock(listItemBlockName);
                const offset = (outBlock as Parent).offset(listItem!);
                const { name, meta, children } = (outBlock as any).getState();
                copyState.push({
                    name,
                    meta,
                    children: children.filter((_: unknown, index: number) =>
                        position === 'start' ? index >= offset : index <= offset,
                    ),
                });
            }
            else {
                if (position === 'start' && startOffset < startBlock.text.length) {
                    copyState.push({
                        name: 'paragraph',
                        text: startBlock.text.substring(startOffset),
                    });
                }
                else if (position === 'end' && endOffset > 0) {
                    copyState.push({
                        name: 'paragraph',
                        text: endBlock.text.substring(0, endOffset),
                    });
                }
            }
        };

        if (anchorOutMostBlock === focusOutMostBlock) {
            // Handle anchor and focus in same list\quote block
            if (/block-quote|table/.test(anchorOutMostBlock!.blockName)) {
                copyState.push((anchorOutMostBlock as Parent).getState());
            }
            else {
                const listItemBlockName
          = anchorOutMostBlock!.blockName === 'task-list'
              ? 'task-list-item'
              : 'list-item';
                const anchorFarthestListItem
          = anchorBlock.farthestBlock(listItemBlockName);
                const focusFarthestListItem
          = focusBlock.farthestBlock(listItemBlockName);
                const anchorOffset = (anchorOutMostBlock as Parent).offset(
                    anchorFarthestListItem!,
                );
                const focusOffset = (anchorOutMostBlock as Parent).offset(
                    focusFarthestListItem!,
                );
                const minOffset = Math.min(anchorOffset, focusOffset);
                const maxOffset = Math.max(anchorOffset, focusOffset);
                const { name, meta, children } = (anchorOutMostBlock as any).getState();
                copyState.push({
                    name,
                    meta,
                    children: children.filter(
                        (_: unknown, index: number) =>
                            index >= minOffset && index <= maxOffset,
                    ),
                });
            }
        }
        else {
            getPartialState('start');
            // Get State between the start outmost block and the end outmost block.
            let node = startOutBlock?.next;
            while (node && node !== endOutBlock) {
                copyState.push((node as Parent).getState());
                node = node.next;
            }
            getPartialState('end');
        }

        const mdGenerator = new StateToMarkdown();

        text = mdGenerator.generate(copyState);
        html = getClipBoardHtml(text, {
            frontMatter,
            math,
            isGitlabCompatibilityEnabled,
            superSubScript,
        });

        return { html, text };
    }

    copyHandler(event: ClipboardEvent): void {
        const { html, text } = this.getClipboardData();

        const { copyType } = this;

        if (!event.clipboardData)
            return;

        switch (copyType) {
            case 'normal': {
                event.clipboardData.setData('text/html', html);
                event.clipboardData.setData('text/plain', text);
                break;
            }

            case 'copyAsHtml': {
                event.clipboardData.setData('text/html', '');
                event.clipboardData.setData('text/plain', html);
                break;
            }

            case 'copyAsMarkdown': {
                event.clipboardData.setData('text/html', '');
                event.clipboardData.setData('text/plain', text);
                break;
            }

            case 'copyCodeContent': {
                event.clipboardData.setData('text/html', '');
                event.clipboardData.setData('text/plain', text);
                break;
            }
        }
    }

    cutHandler() {
        const selection = this.selection.getSelection();
        if (selection == null)
            return;

        const {
            isSelectionInSameBlock,
            anchor,
            anchorBlock,
            focus,
            focusBlock,
            direction,
        } = selection;

        // Handler `cut` event in the same block.
        if (isSelectionInSameBlock) {
            const { text } = anchorBlock;
            const startOffset
        = direction === 'forward' ? anchor.offset : focus.offset;
            const endOffset = direction === 'forward' ? focus.offset : anchor.offset;

            anchorBlock.text
        = text.substring(0, startOffset) + text.substring(endOffset);

            return anchorBlock.setCursor(startOffset, startOffset, true);
        }

        const anchorOutMostBlock = anchorBlock.outMostBlock;
        const focusOutMostBlock = focusBlock.outMostBlock;

        const startOutBlock
      = direction === 'forward' ? anchorOutMostBlock : focusOutMostBlock;
        const endOutBlock
      = direction === 'forward' ? focusOutMostBlock : anchorOutMostBlock;

        if (startOutBlock == null || endOutBlock == null)
            return;

        const startBlock = direction === 'forward' ? anchorBlock : focusBlock;
        const endBlock = direction === 'forward' ? focusBlock : anchorBlock;
        const startOffset = direction === 'forward' ? anchor.offset : focus.offset;
        const endOffset = direction === 'forward' ? focus.offset : anchor.offset;
        let cursorBlock: Nullable<Content> = null;
        let cursorOffset;

        const removePartial = (position: 'start' | 'end') => {
            const outBlock = position === 'start' ? startOutBlock : endOutBlock;
            const block = position === 'start' ? startBlock : endBlock;
            // Handle anchor and focus in different blocks
            if (
                /block-quote|code-block|html-block|table|math-block|frontmatter|diagram/.test(
                    outBlock.blockName,
                )
            ) {
                if (position === 'start') {
                    const state
            = outBlock.blockName === 'block-quote'
                ? deepClone(emptyStates['block-quote'])
                : deepClone(emptyStates.paragraph);
                    const newBlock = ScrollPage.loadBlock(
                        (state as IBlockQuoteState | IParagraphState).name,
                    ).create(this.muya, state);
                    outBlock.replaceWith(newBlock);
                    cursorBlock = newBlock.firstContentInDescendant();
                    cursorOffset = 0;
                }
                else {
                    outBlock.remove();
                }
            }
            else if (/bullet-list|order-list|task-list/.test(outBlock.blockName)) {
                const listItemBlockName
          = outBlock.blockName === 'task-list' ? 'task-list-item' : 'list-item';
                const listItem = block.farthestBlock(listItemBlockName)!;
                const offset = outBlock.offset(listItem);
                outBlock.forEach((item, index) => {
                    if (position === 'start' && index === offset) {
                        const state = {
                            name: listItemBlockName,
                            children: [
                                {
                                    name: 'paragraph',
                                    text: '',
                                },
                            ],
                        };
                        const newListItem = ScrollPage.loadBlock(state.name).create(
                            this.muya,
                            state,
                        );
                        (item as any).replaceWith(newListItem);
                        cursorBlock = newListItem.firstContentInDescendant();
                        cursorOffset = 0;
                    }
                    else if (
                        (position === 'start' && index > offset)
                        || (position === 'end' && index <= offset)
                    ) {
                        if (item.isOnlyChild())
                            outBlock.remove();
                        else item.remove();
                    }
                });
            }
            else {
                if (position === 'start') {
                    startBlock.text = startBlock.text.substring(0, startOffset);
                    cursorBlock = startBlock;
                    cursorOffset = startOffset;
                }
                else if (position === 'end') {
                    if (cursorBlock) {
                        cursorBlock.text += endBlock.text.substring(endOffset);
                        endOutBlock.remove();
                    }
                }
            }
        };

        if (anchorOutMostBlock === focusOutMostBlock) {
            // Handle anchor and focus in same list\quote block
            if (anchorOutMostBlock?.blockName === 'block-quote') {
                const state = deepClone(emptyStates['block-quote']);
                const newQuoteBlock = ScrollPage.loadBlock(
                    (state as IBlockQuoteState).name,
                ).create(this.muya, state);
                anchorOutMostBlock.replaceWith(newQuoteBlock);
                cursorBlock = newQuoteBlock.firstContentInDescendant();
                cursorOffset = 0;
            }
            else if (anchorOutMostBlock?.blockName === 'table') {
                const state = {
                    name: 'paragraph',
                    text: '',
                };
                const newBlock = ScrollPage.loadBlock(state.name).create(
                    this.muya,
                    state,
                );
                anchorOutMostBlock.replaceWith(newBlock);
                cursorBlock = newBlock.firstContentInDescendant();
                cursorOffset = 0;
            }
            else {
                const listItemBlockName
          = anchorOutMostBlock?.blockName === 'task-list'
              ? 'task-list-item'
              : 'list-item';
                const anchorFarthestListItem
          = anchorBlock.farthestBlock(listItemBlockName)!;
                const focusFarthestListItem
          = focusBlock.farthestBlock(listItemBlockName)!;
                const anchorOffset = anchorOutMostBlock?.offset(anchorFarthestListItem);
                const focusOffset = anchorOutMostBlock?.offset(focusFarthestListItem);

                if (anchorOffset == null || focusOffset == null)
                    return;

                const minOffset = Math.min(anchorOffset, focusOffset);
                const maxOffset = Math.max(anchorOffset, focusOffset);
                anchorOutMostBlock?.forEach((item, index) => {
                    if (index === minOffset) {
                        const state = {
                            name: listItemBlockName,
                            children: [
                                {
                                    name: 'paragraph',
                                    text: '',
                                },
                            ],
                        };
                        const newListItem = ScrollPage.loadBlock(state.name).create(
                            this.muya,
                            state,
                        );
                        (item as any).replaceWith(newListItem);
                        cursorBlock = newListItem.firstContentInDescendant();
                        cursorOffset = 0;
                    }
                    else if (index > minOffset && index <= maxOffset) {
                        item.remove();
                    }
                });
            }
        }
        else {
            removePartial('start');
            // Get State between the start outmost block and the end outmost block.
            let node = startOutBlock.next;
            while (node && node !== endOutBlock) {
                const temp = node.next;
                node.remove();
                node = temp;
            }
            removePartial('end');
        }

        if (cursorBlock && cursorOffset != null)
            cursorBlock.setCursor(cursorOffset, cursorOffset, true);

        if (this.scrollPage?.length() === 0) {
            const state = {
                name: 'paragraph',
                text: '',
            };

            const newParagraphBlock = ScrollPage.loadBlock('paragraph').create(
                this.muya,
                state,
            );
            this.scrollPage.append(newParagraphBlock, 'user');
            cursorBlock = newParagraphBlock.firstContentInDescendant();

            cursorBlock && cursorBlock.setCursor(0, 0, true);
        }
    }

    // eslint-disable-next-line complexity
    async pasteHandler(event: ClipboardEvent): Promise<void> {
        event.preventDefault();
        event.stopPropagation();

        const { muya } = this;
        const {
            bulletListMarker,
            footnote,
            isGitlabCompatibilityEnabled,
            math,
            trimUnnecessaryCodeBlockEmptyLines,
            frontMatter,
        } = muya.options;
        const selection = this.selection.getSelection();
        if (!selection)
            return;

        const { isSelectionInSameBlock, anchorBlock } = selection;

        if (!isSelectionInSameBlock) {
            this.cutHandler();

            return this.pasteHandler(event);
        }

        if (!anchorBlock || !event.clipboardData)
            return;

        const text = event.clipboardData.getData('text/plain');
        let html = event.clipboardData.getData('text/html');

        // Support pasted URLs from Firefox.
        if (URL_REG.test(text) && !/\s/.test(text) && !html)
            html = `<a href="${text}">${text}</a>`;

        // Remove crap from HTML such as meta data and styles.
        html = await normalizePastedHTML(html);
        const copyType = getCopyTextType(html, text, this.pasteType);

        const { start, end } = anchorBlock.getCursor()!;
        const { text: content } = anchorBlock;
        let wrapperBlock = anchorBlock.getAnchor();
        const originWrapperBlock = wrapperBlock;

        if (/html|text/.test(copyType)) {
            let markdown
        = copyType === 'html' && anchorBlock.blockName !== 'codeblock.content'
            ? new HtmlToMarkdown({ bulletListMarker }).generate(html)
            : text;

            if (
                /\n\n/.test(markdown)
                && anchorBlock.blockName !== 'codeblock.content'
            ) {
                if (start.offset !== end.offset) {
                    anchorBlock.text
            = content.substring(0, start.offset) + content.substring(end.offset);
                    anchorBlock.update();
                }
                // Has multiple paragraphs.
                const states = new MarkdownToState({
                    footnote,
                    math,
                    isGitlabCompatibilityEnabled,
                    trimUnnecessaryCodeBlockEmptyLines,
                    frontMatter,
                }).generate(markdown);

                for (const state of states) {
                    const newBlock = ScrollPage.loadBlock(state.name).create(muya, state);
                    wrapperBlock?.parent?.insertAfter(newBlock, wrapperBlock);
                    wrapperBlock = newBlock;
                }

                // Remove empty paragraph when paste.
                if (
                    originWrapperBlock?.blockName === 'paragraph'
                    && (originWrapperBlock.getState() as any).text === ''
                )
                    originWrapperBlock.remove();

                const cursorBlock = wrapperBlock?.firstContentInDescendant();
                const offset = cursorBlock?.text.length;

                if (offset != null)
                    cursorBlock?.setCursor(offset, offset, true);
            }
            else {
                if (anchorBlock.blockName === 'language-input')
                    markdown = markdown.replace(/\n/g, '');
                else if (anchorBlock.blockName === 'table.cell.content')
                    markdown = markdown.replace(/\n/g, '<br/>');

                anchorBlock.text
          = content.substring(0, start.offset)
          + markdown
          + content.substring(end.offset);
                const offset = start.offset + markdown.length;
                anchorBlock.setCursor(offset, offset, true);
                // Update html preview if the out container is `html-block`
                if (
                    anchorBlock instanceof CodeBlockContent
                    && anchorBlock.outContainer
                    && /html-block|math-block|diagram/.test(
                        anchorBlock.outContainer.blockName,
                    )
                ) {
                    (anchorBlock.outContainer.attachments.head as any).update(
                        anchorBlock.text,
                    );
                }
            }
        }
        else {
            const state = {
                name: 'code-block',
                meta: {
                    type: 'fenced',
                    lang: 'html',
                },
                text,
            };
            const newBlock = ScrollPage.loadBlock(state.name).create(muya, state);
            wrapperBlock?.parent?.insertAfter(newBlock, wrapperBlock);
            const offset = text.length;

            newBlock.lastContentInDescendant().setCursor(offset, offset, true);
        }
    }

    copyAsMarkdown() {
        this.copyType = 'copyAsMarkdown';
        document.execCommand('copy');
        this.copyType = 'normal';
    }

    copyAsHtml() {
        this.copyType = 'copyAsHtml';
        document.execCommand('copy');
        this.copyType = 'normal';
    }

    pasteAsPlainText() {
        this.pasteType = 'pasteAsPlainText';
        document.execCommand('paste');
        this.pasteType = 'normal';
    }

    copy(type: string, info: string) {
        this.copyType = type;
        this.copyInfo = info;
        document.execCommand('copy');
        this.copyType = 'normal';
    }
}

export default Clipboard;
