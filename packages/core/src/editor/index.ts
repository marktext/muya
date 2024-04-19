import * as otText from 'ot-text-unicode';
import ScrollPage from '../block/scrollPage';
import type Content from '../block/base/content';
import type Format from '../block/base/format';
import Clipboard from '../clipboard';
import { BLOCK_DOM_PROPERTY, isFirefox } from '../config';
import History from '../history';
import InlineRenderer from '../inlineRenderer';
import { Search } from '../search';
import Selection from '../selection';
import JSONState from '../state';
import type { TState } from '../state/types';
import type { Nullable } from '../types';
import { hasPick } from '../utils';
import logger from '../utils/logger';
import type { Muya } from '../muya';

const debug = logger('editor:');

class Editor {
    public jsonState: JSONState;
    public inlineRenderer: InlineRenderer;
    public selection: Selection;
    public searchModule: Search;
    public clipboard: Clipboard;
    public history: History;
    public scrollPage: Nullable<ScrollPage> = null;
    private _activeContentBlock: Nullable<Content> = null;

    constructor(public muya: Muya) {
        const state = muya.options.json || muya.options.markdown || '';

        this.jsonState = new JSONState(muya, state);
        this.inlineRenderer = new InlineRenderer(muya);
        this.selection = new Selection(muya);
        this.searchModule = new Search(muya);
        this.clipboard = Clipboard.create(muya);
        this.history = new History(muya);
    }

    get activeContentBlock() {
        return this._activeContentBlock;
    }

    set activeContentBlock(block) {
        const { activeContentBlock: oldActiveContentBlock } = this;
        if (block !== oldActiveContentBlock) {
            this._activeContentBlock = block;
            if (oldActiveContentBlock)
                oldActiveContentBlock.blurHandler();

            if (block)
                block.focusHandler();
        }
    }

    init() {
        const { muya } = this;
        const state = this.jsonState.getState();

        this.scrollPage = ScrollPage.create(muya, state);

        this._dispatchEvents();
        this.focus();
    }

    private _dispatchEvents() {
        const { eventCenter } = this.muya;
        const { domNode } = this.muya;

        const eventHandler = (event: Event) => {
            const { anchorBlock, isSelectionInSameBlock }
        = this.selection.getSelection() ?? {};
            // Fix issue that language input can not get focus when it's empty(Firefox only)
            if (
                event.type === 'click'
                && isFirefox
                && (event.target as HTMLElement).textContent === ''
                && (event.target as HTMLElement).classList.contains('mu-language-input')
            ) {
                ((event.target as Element)[BLOCK_DOM_PROPERTY] as Content)?.setCursor(
                    0,
                    0,
                    true,
                );
                return;
            }

            if (!isSelectionInSameBlock || !anchorBlock) {
                this.activeContentBlock = null;
                return;
            }

            this.activeContentBlock = anchorBlock;

            switch (event.type) {
                case 'click': {
                    anchorBlock.clickHandler(event);
                    break;
                }
                case 'input': {
                    anchorBlock.inputHandler(event);
                    break;
                }
                case 'keydown': {
                    anchorBlock.keydownHandler(event);
                    break;
                }
                case 'keyup': {
                    anchorBlock.keyupHandler(event);
                    break;
                }
                case 'compositionend':
                case 'compositionstart': {
                    anchorBlock.composeHandler(event);
                    break;
                }
            }
        };

        eventCenter.attachDOMEvent(domNode, 'click', eventHandler);
        eventCenter.attachDOMEvent(domNode, 'input', eventHandler);
        eventCenter.attachDOMEvent(domNode, 'keydown', eventHandler);
        eventCenter.attachDOMEvent(domNode, 'keyup', eventHandler);
        eventCenter.attachDOMEvent(domNode, 'compositionend', eventHandler);
        eventCenter.attachDOMEvent(domNode, 'compositionstart', eventHandler);
    }

    focus() {
    // TODO: the cursor maybe passed by muya options.cursor, and no need to find the first leaf block.
        const firstLeafBlock = this.scrollPage?.firstContentInDescendant();

        if (firstLeafBlock == null)
            return;

        const cursor = {
            path: firstLeafBlock.path,
            block: firstLeafBlock,
            anchor: {
                offset: 0,
            },
            focus: {
                offset: 0,
            },
        };

        const needUpdated
      = firstLeafBlock.blockName === 'paragraph.content'
      && (firstLeafBlock as Format).checkNeedRender(cursor);

        firstLeafBlock.setCursor(0, 0, needUpdated);
    }

    updateContents(operations: any, selection: any, source: any) {
        const { muya } = this;
        this.jsonState.dispatch(operations, source);

        // Codes bellow are copy from `ot-json1.apply` and modified.
        if (operations === null)
            return;

        // Phase 1: Pick. Returns updated subDocument.
        function pick(subDoc: any, descent: any) {
            const stack = [];

            let i = 0;

            for (; i < descent.length; i++) {
                const d = descent[i];
                if (Array.isArray(d))
                    break;
                if (typeof d === 'object')
                    continue;
                stack.push(subDoc);
                // Its valid to descend into a null space - just we can't pick there.
                subDoc = subDoc == null ? undefined : subDoc.queryBlock([d]);
            }

            // Children. These need to be traversed in reverse order here.
            for (let j = descent.length - 1; j >= i; j--)
                subDoc = pick(subDoc, descent[j]);

            // Then back again.
            for (--i; i >= 0; i--) {
                const d = descent[i];
                if (typeof d !== 'object') {
                    const container = stack.pop();
                    if (
                        subDoc
                        === (container == null ? undefined : container.queryBlock([d]))
                    ) {
                        subDoc = container;
                    }
                    else {
                        if (subDoc === undefined) {
                            // TODO: handler typeof d === 'string'
                            typeof d === 'number' && container.find(d).remove('api');
                            subDoc = container;
                        }
                        else {
                            typeof d === 'number'
                            && container.find(d).replaceWith(subDoc, 'api');
                            subDoc = container;
                        }
                    }
                }
                else if (hasPick(d)) {
                    subDoc = undefined;
                }
            }

            return subDoc;
        }

        const snapshot = pick(this.scrollPage, operations);

        function drop(root: any, descent: any) {
            let subDoc = root;
            let i = 0; // For reading
            let m = 0;
            const rootContainer = { root }; // This is an avoidable allocation.
            let container: any = rootContainer;
            let key = 'root'; // For writing

            function mut() {
                for (; m < i; m++) {
                    const d = descent[m];
                    if (typeof d === 'object')
                        continue;
                    container
            = key === 'root' ? container[key] : container.queryBlock([key]);
                    key = d;
                }
            }

            for (; i < descent.length; i++) {
                const d = descent[i];

                if (Array.isArray(d)) {
                    const child = drop(subDoc, d);
                    if (child !== subDoc && child !== undefined) {
                        mut();
                        // It maybe never go into this if statement.
                        subDoc = container[key] = child;
                    }
                }
                else if (typeof d === 'object') {
                    if (d.i !== undefined) {
                        // Insert
                        mut();
                        const ref = container.find(key);
                        if (typeof key === 'number') {
                            const newBlock = ScrollPage.loadBlock(d.i.name).create(muya, d.i);
                            container.insertBefore(newBlock, ref, 'api');

                            subDoc = newBlock;
                        }
                        else {
                            switch (key) {
                                case 'checked': {
                                    ref.update(d.i, 'api');
                                    break;
                                }

                                case 'meta':
                                    // Do nothing.
                                    break;

                                default:
                                    debug.warn(`Unknown operation path ${key}`);
                                    break;
                            }
                        }
                    }

                    if (d.es) {
                        // Edit. Ok because its illegal to drop inside mixed region
                        mut();
                        if (subDoc.blockName === 'table.cell') {
                            subDoc.align = otText.type.apply(subDoc.align, d.es);
                        }
                        else if (subDoc.blockName === 'language-input') {
                            subDoc._text = otText.type.apply(subDoc.text, d.es);
                            subDoc.parent.meta.lang = subDoc.text;
                            subDoc.update();
                        }
                        else if (subDoc.blockName === 'code-block') {
                            // Handle modify code block type.
                            subDoc.meta.type = otText.type.apply(subDoc.meta.type, d.es);
                        }
                        else {
                            subDoc._text = otText.type.apply(subDoc.text, d.es);
                            subDoc.update();
                        }
                    }
                }
                else {
                    subDoc = subDoc != null ? subDoc.queryBlock([d]) : undefined;
                }
            }

            return rootContainer.root;
        }

        drop(snapshot, operations);

        if (selection) {
            const { anchorPath, anchor, focus, isSelectionInSameBlock } = selection;
            const cursorBlock = this.scrollPage?.queryBlock(anchorPath);

            const begin = Math.min(anchor.offset, focus.offset);
            const end = Math.max(anchor.offset, focus.offset);

            if (isSelectionInSameBlock && cursorBlock && cursorBlock.isContent())
                cursorBlock.setCursor(begin, end, true);
            else
                this.selection.setSelection(selection);
        }
    }

    setContent(content: TState[] | string, autoFocus = false) {
        this.jsonState.setContent(content);
        const state = this.jsonState.getState();

        this.scrollPage!.updateState(state);
        this.history.clear();

        if (autoFocus)
            this.focus();
    }
}

export default Editor;
