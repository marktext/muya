import type { VNode } from 'snabbdom';
import { ScrollPage } from '../../block/scrollPage';
import { search } from '../../utils/prism';
import { h, patch } from '../../utils/snabbdom';
import BaseScrollFloat from '../baseScrollFloat';
import fileIcons from '../utils/fileIcons';

import type LangInputContent from '../../block/content/langInputContent';
import type ParagraphContent from '../../block/content/paragraphContent';
import type { Muya } from '../../index';

import './index.css';

const defaultOptions = {
    placement: 'bottom-start',
    modifiers: {
        offset: {
            offset: '0, 0',
        },
    },
    showArrow: false,
};

export class CodeBlockLanguageSelector extends BaseScrollFloat {
    static pluginName = 'codePicker';
    private oldVNode: VNode | null = null;
    private block: ParagraphContent | LangInputContent | null = null;

    constructor(muya: Muya, options = {}) {
        const name = 'mu-list-picker';
        const opts = Object.assign({}, defaultOptions, options);
        super(muya, name, opts);
        this.listen();
    }

    override listen() {
        super.listen();
        const { eventCenter } = this.muya;

        eventCenter.on('content-change', ({ block }) => {
            if (block.blockName !== 'paragraph.content' && block.blockName !== 'language-input')
                return;

            const { text, domNode } = block;
            let lang = '';
            if (block.blockName === 'paragraph.content') {
                const token = text.match(/(^ {0,3}`{3,})([^` ]+)/);
                if (token && token[2])
                    lang = token[2];
            }
            else if (block.blockName === 'language-input') {
                lang = text;
            }

            const modes = search(lang);
            if (modes.length) {
                this.block = block;
                this.show(domNode);
                this.renderArray = modes;
                this.activeItem = modes[0];
                this.render();
            }
            else {
                this.hide();
            }
        });
    }

    render() {
        const { renderArray, oldVNode, scrollElement, activeItem } = this;
        let children = (
            renderArray as {
                name: string;
                [key: string]: string;
            }[]
        ).map((item) => {
            let iconClassNames;
            if (item.name)
                iconClassNames = fileIcons.getClassByLanguage(item.name);

            // Because `markdown mode in Codemirror` don't have extensions.
            // if still can not get the className, add a common className 'atom-icon light-cyan'
            if (!iconClassNames && item.name === 'markdown')
                iconClassNames = fileIcons.getClassByName('fakeName.md');

            const text = h('div.language', item.name);
            const selector = activeItem === item ? 'li.item.active' : 'li.item';
            const itemContent = [text];

            if (iconClassNames) {
                const iconSelector
        = `span${
         iconClassNames
            .split(/\s/)
            .map((s: string) => `.${s}`)
            .join('')}`;
                const icon = h('div.icon-wrapper', h(iconSelector));
                itemContent.push(icon);
            }

            return h(
                selector,
                {
                    dataset: {
                        label: item.name,
                    },
                    on: {
                        click: () => {
                            this.selectItem(item);
                        },
                    },
                },
                itemContent,
            );
        });

        if (children.length === 0)
            children = [h('div.no-result', 'No result')];

        const vnode = h('ul', children);

        if (oldVNode)
            patch(oldVNode, vnode);
        else
            patch(scrollElement!, vnode);

        this.oldVNode = vnode;
    }

    getItemElement(item: { name: string }): HTMLElement {
        const { name } = item;

        // Item element will always existed, so use !.
        return this.floatBox!.querySelector(`[data-label="${name}"]`)!;
    }

    override selectItem(item: { name: string }) {
        const { block, muya } = this;
        const { name } = item;

        if (!block)
            return;

        function isParagraphContent(
            b: ParagraphContent | LangInputContent,
        ): b is ParagraphContent {
            return b.blockName === 'paragraph.content';
        }

        if (isParagraphContent(block)) {
            const state
        = muya.options.isGitlabCompatibilityEnabled && name === 'math'
            ? {
                    name: 'math-block',
                    meta: {
                        mathStyle: 'gitlab',
                    },
                    text: '',
                }
            : {
                    name: 'code-block',
                    meta: {
                        lang: name,
                        type: 'fenced',
                    },
                    text: '',
                };

            const newBlock = ScrollPage.loadBlock(state.name).create(
                this.muya,
                state,
            );
            block.parent?.replaceWith(newBlock);
            const codeContent = newBlock.lastContentInDescendant();
            codeContent.setCursor(0, 0);
        }
        else {
            block.text = name;
            block.update();
            block.parent!.lang = name;
            block.parent?.lastContentInDescendant()?.setCursor(0, 0);
        }

        super.selectItem(item);
    }
}
