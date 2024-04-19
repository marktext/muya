import ScrollPage from '../block';
import emptyStates from '../config/emptyStates';
import { deepClone } from '../utils';
import type { IBlockQuoteState, IParagraphState } from '../state/types';
import type Content from '../block/base/content';
import type { Nullable } from '../types';
import Base from './base';

class Cut extends Base {
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
                    const state = outBlock.blockName === 'block-quote' ? deepClone(emptyStates['block-quote']) : deepClone(emptyStates.paragraph);
                    const newBlock = ScrollPage.loadBlock((state as IBlockQuoteState | IParagraphState).name).create(
                        this.muya,
                        state,
                    );
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
                        else
                            item.remove();
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
                const newQuoteBlock = ScrollPage.loadBlock((state as IBlockQuoteState).name).create(
                    this.muya,
                    state,
                );
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
}

export default Cut;
