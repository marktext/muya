import type { VNode } from 'snabbdom';
import type { Muya } from '../../index';
import type { Token } from '../../inlineRenderer/types';
import type { IBaseOptions } from '../types';

import type { FormatToolIcon } from './config';
import Format from '../../block/base/format';
import { isKeyboardEvent } from '../../utils';
import { h, patch } from '../../utils/snabbdom';
import BaseFloat from '../baseFloat';
import icons from './config';
import './index.css';

const defaultOptions = {
    placement: 'top' as const,
    modifiers: {
        offset: {
            offset: '0, 5',
        },
    },
    showArrow: false,
};

export class InlineFormatToolbar extends BaseFloat {
    static pluginName = 'formatPicker';
    private oldVNode: VNode | null = null;
    private block: Format | null = null;
    private formats: Token[] = [];
    public override options: IBaseOptions;
    private icons: FormatToolIcon[] = icons;
    private formatContainer: HTMLDivElement = document.createElement('div');

    constructor(muya: Muya, options = {}) {
        const name = 'mu-format-picker';
        const opts = Object.assign({}, defaultOptions, options);
        super(muya, name, opts);
        this.options = opts;
        // BaseFloat Class has `container` and `floatBox` properties.
        this.container!.appendChild(this.formatContainer);
        this.floatBox!.classList.add('mu-format-picker-container');
        this.listen();
    }

    override listen() {
        const { eventCenter, domNode, editor } = this.muya;
        super.listen();
        eventCenter.subscribe('muya-format-picker', ({ reference, block }) => {
            if (reference) {
                this.block = block;
                this.formats = block.getFormatsInRange().formats;
                requestAnimationFrame(() => {
                    this.show(reference);
                    this.render();
                });
            }
            else {
                this.hide();
            }
        });

        const HASH = {
            b: 'strong',
            i: 'em',
            u: 'u',
            d: 'del',
            e: 'inline_code',
            l: 'link',
        };

        const SHIFT_HASH = {
            h: 'mark',
            e: 'inline_math',
            i: 'image',
            r: 'clear',
        } as const;

        const handleKeydown = (event: Event) => {
            if (!isKeyboardEvent(event))
                return;

            const { key, shiftKey, metaKey, ctrlKey } = event;
            const selection = editor.selection.getSelection();
            if (!selection)
                return;

            const { anchorBlock, isSelectionInSameBlock } = selection;

            if (isSelectionInSameBlock) {
                if (!(anchorBlock instanceof Format) || (!metaKey && !ctrlKey))
                    return;

                if (shiftKey) {
                    if (Object.keys(SHIFT_HASH).includes(key)) {
                        event.preventDefault();
                        anchorBlock.format(SHIFT_HASH[key as keyof typeof SHIFT_HASH]);
                    }
                }
                else {
                    if (Object.keys(HASH).includes(key)) {
                        event.preventDefault();
                        anchorBlock.format(HASH[key as keyof typeof HASH]);
                    }
                }
            }
        };

        eventCenter.attachDOMEvent(domNode, 'keydown', handleKeydown);
    }

    render() {
        const { icons, oldVNode, formatContainer, formats } = this;
        const { i18n } = this.muya;
        const children = icons.map((i) => {
            const iconWrapperSelector = 'div.icon-wrapper';
            const icon = h(
                'i.icon',
                h(
                    'i.icon-inner',
                    {
                        style: {
                            'background': `url(${i.icon}) no-repeat`,
                            'background-size': '100%',
                        },
                    },
                    '',
                ),
            );
            const iconWrapper = h(iconWrapperSelector, icon);

            let itemSelector = `li.item.${i.type}`;
            if (
                formats.some(
                    f =>
                        f.type === i.type || (f.type === 'html_tag' && f.tag === i.type),
                )
            ) {
                itemSelector += '.active';
            }

            return h(
                itemSelector,
                {
                    attrs: {
                        title: `${i18n.t(i.tooltip)}\n${i.shortcut}`,
                    },
                    on: {
                        click: (event) => {
                            this.selectItem(event, i);
                        },
                    },
                },
                [iconWrapper],
            );
        });

        const vnode = h('ul', children);

        if (oldVNode)
            patch(oldVNode, vnode);
        else
            patch(formatContainer, vnode);

        this.oldVNode = vnode;
    }

    selectItem(event: Event, item: FormatToolIcon) {
        event.preventDefault();
        event.stopPropagation();
        const { selection } = this.muya.editor;
        // TODO: @JOCS, remove use this.selection directly.
        const { anchor, focus, anchorBlock, anchorPath, focusBlock, focusPath }
            = selection;
        const { block } = this;

        selection.setSelection({
            anchor,
            focus,
            anchorBlock: anchorBlock!,
            anchorPath,
            focusBlock: focusBlock!,
            focusPath,
        });
        block!.format(item.type);

        if (/link|image/.test(item.type)) {
            this.hide();
        }
        else {
            const { formats } = block!.getFormatsInRange();
            this.formats = formats;
            this.render();
        }
    }
}
