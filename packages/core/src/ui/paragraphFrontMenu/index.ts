import type { VNode } from 'snabbdom';
import { ScrollPage } from '../../block/scrollPage';
import emptyStates from '../../config/emptyStates';
import BaseFloat from '../baseFloat';
import type { IQuickInsertMenuItem } from '../paragraphQuickInsertMenu/config';
import { replaceBlockByLabel } from '../paragraphQuickInsertMenu/config';
import { deepClone } from '../../utils';
import { h, patch } from '../../utils/snabbdom';

import type Parent from '../../block/base/parent';
import type AtxHeading from '../../block/commonMark/atxHeading';
import type { Muya } from '../../index';
import type { IAtxHeadingState, IBulletListState, IOrderListState, ITaskListState } from '../../state/types';
import { FRONT_MENU, canTurnIntoMenu } from './config';
import './index.css';

function renderIcon({ label, icon }: { label: string; icon: string }) {
    return h(
        'i.icon',
        h(
      `i.icon-${label.replace(/\s/g, '-')}`,
      {
          style: {
              'background': `url(${icon}) no-repeat`,
              'background-size': '100%',
          },
      },
      '',
        ),
    );
}

const defaultOptions = {
    placement: 'bottom',
    modifiers: {
        offset: {
            offset: '0, 10',
        },
    },
    showArrow: false,
};

export class ParagraphFrontMenu extends BaseFloat {
    static pluginName = 'frontMenu';
    public reference: HTMLDivElement | null = null;
    private oldVNode: VNode | null = null;
    private block: Parent | null = null;
    private frontMenuContainer: HTMLDivElement = document.createElement('div');

    constructor(muya: Muya, options = {}) {
        const name = 'mu-front-menu';
        const opts = Object.assign({}, defaultOptions, options);
        super(muya, name, opts);
        Object.assign((this.container!.parentNode as HTMLElement).style, {
            overflow: 'visible',
        });
        this.container!.appendChild(this.frontMenuContainer);
        this.listen();
    }

    override listen() {
        const { container } = this;
        const { eventCenter } = this.muya;
        super.listen();
        eventCenter.subscribe('muya-front-menu', ({ reference, block }) => {
            if (reference) {
                this.block = block;
                this.reference = reference;
                setTimeout(() => {
                    this.show(reference);
                    this.render();
                }, 0);
            }
        });

        const enterLeaveHandler = () => {
            this.hide();
            this.reference = null;
            this.block = null;
        };

        eventCenter.attachDOMEvent(container!, 'mouseleave', enterLeaveHandler);
    }

    renderSubMenu(subMenu: IQuickInsertMenuItem['children']) {
        const { block } = this;
        const { i18n } = this.muya;
        const children = subMenu.map((menuItem) => {
            const { title, label, subTitle } = menuItem;
            const iconWrapperSelector = 'div.icon-wrapper';
            const iconWrapper = h(
                iconWrapperSelector,
                {
                    props: {
                        title: `${i18n.t(title)}\n${subTitle}`,
                    },
                },
                renderIcon(menuItem),
            );

            let itemSelector = `div.turn-into-item.${label}`;
            if (block?.blockName === 'atx-heading') {
                if (
                    label.startsWith(block.blockName)
                    && label.endsWith(String((block as AtxHeading).meta.level))
                )
                    itemSelector += '.active';
            }
            else if (label === block?.blockName) {
                itemSelector += '.active';
            }

            return h(
                itemSelector,
                {
                    on: {
                        click: (event) => {
                            this.selectItem(event, { label });
                        },
                    },
                },
                [iconWrapper],
            );
        });
        const subMenuSelector = 'li.turn-into-menu';

        return h(subMenuSelector, children);
    }

    render() {
        const { oldVNode, frontMenuContainer, block } = this;
        const { i18n } = this.muya;
        const { blockName } = block!;
        const children = FRONT_MENU.map(({ icon, label, text, shortCut }) => {
            const iconWrapperSelector = 'div.icon-wrapper';
            const iconWrapper = h(iconWrapperSelector, renderIcon({ icon, label }));
            const textWrapper = h('span.text', i18n.t(text));
            const shortCutWrapper = h('div.short-cut', [h('span', shortCut)]);
            const itemSelector = `li.item.${label}`;
            const itemChildren = [iconWrapper, textWrapper, shortCutWrapper];

            return h(
                itemSelector,
                {
                    on: {
                        click: (event) => {
                            this.selectItem(event, { label });
                        },
                    },
                },
                itemChildren,
            );
        });

        // Frontmatter can not be duplicated
        if (blockName === 'frontmatter')
            children.splice(0, 1);

        const subMenu = canTurnIntoMenu(block!);
        if (subMenu.length) {
            const line = h('li.divider');
            children.unshift(line);
            children.unshift(this.renderSubMenu(subMenu));
        }

        const vnode = h('ul', children);

        if (oldVNode)
            patch(oldVNode, vnode);
        else
            patch(frontMenuContainer, vnode);

        this.oldVNode = vnode;
    }

    selectItem(event: Event, { label }: { label: string }) {
        event.preventDefault();
        event.stopPropagation();
        if (!this.block)
            return;

        const { block, muya } = this;
        const { editor } = muya;
        const oldState = block.getState();
        let cursorBlock = null;
        let state = null;
        const { bulletListMarker, orderListDelimiter } = muya.options;

        if (/duplicate|new|delete/.test(label)) {
            switch (label) {
                case 'duplicate': {
                    state = deepClone(oldState);
                    const dupBlock = ScrollPage.loadBlock(state.name).create(muya, state);
                    block.parent!.insertAfter(dupBlock, block);
                    cursorBlock = dupBlock.lastContentInDescendant();
                    break;
                }

                case 'new': {
                    state = deepClone(emptyStates.paragraph);
                    const newBlock = ScrollPage.loadBlock('paragraph').create(
                        muya,
                        state,
                    );
                    block.parent!.insertAfter(newBlock, block);
                    cursorBlock = newBlock.lastContentInDescendant();
                    break;
                }

                case 'delete': {
                    if (block.prev) {
                        cursorBlock = block.prev.lastContentInDescendant();
                    }
                    else if (block.next) {
                        cursorBlock = block.next.firstContentInDescendant();
                    }
                    else {
                        state = deepClone(emptyStates.paragraph);
                        const newBlock = ScrollPage.loadBlock('paragraph').create(
                            muya,
                            state,
                        );
                        block.parent!.insertAfter(newBlock, block);
                        cursorBlock = newBlock.lastContentInDescendant();
                    }
                    block.remove();
                }
            }
        }
        else {
            switch (block.blockName) {
                case 'paragraph':
                    // fall through
                case 'atx-heading': {
                    if (block.blockName === 'paragraph' && block.blockName === label)
                        break;

                    if (
                        block.blockName === 'atx-heading'
                        && label.split(' ')[1] === String((oldState as IAtxHeadingState).meta.level)
                    )
                        break;

                    const rawText = (oldState as IAtxHeadingState).text;
                    const text
            = block.blockName === 'paragraph'
                ? rawText
                : rawText.replace(/^ {0,3}#{1,6}(?:\s{1,}|$)/, '');
                    replaceBlockByLabel({
                        block,
                        label,
                        muya,
                        text,
                    });
                    break;
                }

                case 'order-list':
                    // fall through
                case 'bullet-list':
                    // fall through
                case 'task-list': {
                    if (block.blockName === label)
                        break;

                    state = deepClone(oldState) as IOrderListState | ITaskListState | IBulletListState;
                    if (block.blockName === 'task-list') {
                        state.children.forEach((listItem) => {
                            listItem.name = 'list-item';
                            delete (listItem as any).meta;
                        });
                    }
                    const {
                        loose,
                        delimiter = orderListDelimiter,
                        marker = bulletListMarker,
                    } = state.meta as any;
                    if (label === 'task-list') {
                        state.children.forEach((listItem) => {
                            listItem.name = 'task-list-item';
                            (listItem as any).meta = {
                                checked: false,
                            };
                        });
                        state.meta = {
                            marker,
                            loose,
                        };
                    }
                    else if (label === 'order-list') {
                        (state as any).meta = {
                            delimiter,
                            loose,
                        };
                    }
                    else {
                        state.meta = {
                            marker,
                            loose,
                        };
                    }
                    // TODO: @JOCS, remove use this.selection directly.
                    const { anchorPath, anchor, focus, isSelectionInSameBlock }
            = editor.selection;
                    const listBlock = ScrollPage.loadBlock(label).create(muya, state);
                    block.replaceWith(listBlock);
                    const guessCursorBlock
            = muya.editor.scrollPage?.queryBlock(anchorPath);
                    if (guessCursorBlock && isSelectionInSameBlock) {
                        const begin = Math.min(anchor!.offset, focus!.offset);
                        const end = Math.max(anchor!.offset, focus!.offset);
                        // Make guessCursorBlock active
                        guessCursorBlock.setCursor(begin, end, true);
                    }
                    else {
                        cursorBlock = listBlock.firstContentInDescendant();
                    }
                    break;
                }
            }
        }

        if (cursorBlock) {
            // mock cursorBlock focus
            cursorBlock.setCursor(0, 0, true);
        }
        // Delay hide to avoid dispatch enter handler
        setTimeout(this.hide.bind(this));
    }
}
