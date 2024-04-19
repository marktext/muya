import {
    CLASS_NAMES,
    MUYA_DEFAULT_OPTIONS,
} from './config/index';
import Editor from './editor/index';
import EventCenter from './event/index';
import I18n from './i18n/index';
import { Ui } from './ui/ui';
import type { IMuyaOptions } from './types';

import './assets/styles/blockSyntax.css';
import './assets/styles/index.css';
import './assets/styles/inlineSyntax.css';
import './assets/styles/prismjs/light.theme.css';
import type { ILocale } from './i18n/types';
import type { Listener } from './event/types';
import type { TState } from './state/types';

interface IPlugin {
    plugin: any;
    options: any;
}

export class Muya {
    static plugins: IPlugin[] = [];

    static use(plugin: any, options = {}) {
        this.plugins.push({
            plugin,
            options,
        });
    }

    public readonly version = typeof window.MUYA_VERSION === 'undefined' ? 'dev' : window.MUYA_VERSION;
    public options: IMuyaOptions = MUYA_DEFAULT_OPTIONS;
    public eventCenter: EventCenter;
    public domNode: HTMLElement;
    public editor: Editor;
    public ui: Ui;
    public i18n: I18n;

    private _uiPlugins: Record<string, any> = {};

    constructor(element: HTMLElement, options?: Partial<IMuyaOptions>) {
        this.options = Object.assign({}, MUYA_DEFAULT_OPTIONS, options ?? {});
        this.eventCenter = new EventCenter();
        this.domNode = getContainer(element, this.options);
        // this.domNode[BLOCK_DOM_PROPERTY] = this;
        this.editor = new Editor(this);
        this.ui = new Ui(this);
        this.i18n = new I18n(this, this.options.locale);
    }

    init() {
        this.editor.init();

        // UI plugins
        if (Muya.plugins.length) {
            for (const { plugin: Plugin, options: opts } of Muya.plugins)
                this._uiPlugins[Plugin.pluginName] = new Plugin(this, opts);
        }
    }

    locale(object: ILocale) {
        return this.i18n.locale(object);
    }

    /**
     * [on] on custom event
     */
    on(event: string, listener: Listener) {
        this.eventCenter.on(event, listener);
    }

    /**
     * [off] off custom event
     */
    off(event: string, listener: Listener) {
        this.eventCenter.off(event, listener);
    }

    /**
     * [once] subscribe event and listen once
     */
    once(event: string, listener: Listener) {
        this.eventCenter.once(event, listener);
    }

    getState() {
        return this.editor.jsonState.getState();
    }

    getMarkdown() {
        return this.editor.jsonState.getMarkdown();
    }

    undo() {
        this.editor.history.undo();
    }

    redo() {
        this.editor.history.redo();
    }

    /**
     * Search value in current document.
     * @param {string} value
     * @param {object} opts
     */
    search(value: string, opts = {}) {
        return this.editor.searchModule.search(value, opts);
    }

    /**
     * Find preview or next value, and highlight it.
     * @param {string} action : previous or next.
     */
    find(action: 'previous' | 'next') {
        return this.editor.searchModule.find(action);
    }

    replace(replaceValue: string, opt = { isSingle: true, isRegexp: false }) {
        return this.editor.searchModule.replace(replaceValue, opt);
    }

    setContent(content: TState[] | string, autoFocus = false) {
        this.editor.setContent(content, autoFocus);
    }

    focus() {
        this.editor.focus();
    }

    selectAll() {
        this.editor.selection.selectAll();
    }

    destroy() {
        this.eventCenter.detachAllDomEvents();
        // this.domNode[BLOCK_DOM_PROPERTY] = null;
        if (this.domNode.remove)
            this.domNode.remove();

        // Hide all float tools.
        if (this.ui)
            this.ui.hideAllFloatTools();
    }
}

/**
 * [ensureContainerDiv ensure container element is div]
 */
function getContainer(originContainer: HTMLElement, options: IMuyaOptions) {
    const { spellcheckEnabled, hideQuickInsertHint } = options;
    const newContainer = document.createElement('div');
    const attrs = originContainer.attributes;
    // Copy attrs from origin container to new container
    Array.from(attrs).forEach((attr: { name: string; value: string }) => {
        newContainer.setAttribute(attr.name, attr.value);
    });

    if (!hideQuickInsertHint)
        newContainer.classList.add(CLASS_NAMES.MU_SHOW_QUICK_INSERT_HINT);

    newContainer.classList.add(CLASS_NAMES.MU_EDITOR);

    newContainer.setAttribute('contenteditable', 'true');
    newContainer.setAttribute('autocorrect', 'false');
    newContainer.setAttribute('autocomplete', 'off');
    newContainer.setAttribute('spellcheck', spellcheckEnabled ? 'true' : 'false');
    originContainer.replaceWith(newContainer);

    return newContainer;
}
