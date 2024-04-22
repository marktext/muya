import copyIcon from '../../../assets/icons/copy/2.png';
import Parent from '../../base/parent';
import { ScrollPage } from '../../scrollPage';
import type I18n from '../../../i18n';
import type { Muya } from '../../../muya';
import type { Nullable } from '../../../types';
import logger from '../../../utils/logger';
import { h, toHTML } from '../../../utils/snabbdom';
import type { ICodeBlockState, TState } from '../../../state/types';
import type CodeBlock from './index';

const debug = logger('code:');

function renderCopyButton(i18n: I18n) {
    const selector = 'a.mu-code-copy';
    const iconVnode = h(
        'i.icon',
        h(
            'i.icon-inner',
            {
                style: {
                    'background': `url(${copyIcon}) no-repeat`,
                    'background-size': '100%',
                },
            },
            '',
        ),
    );

    return h(
        selector,
        {
            attrs: {
                title: i18n.t('Copy content'),
                contenteditable: 'false',
            },
        },
        iconVnode,
    );
}

class Code extends Parent {
    public override parent: Nullable<CodeBlock> = null;

    static override blockName = 'code';

    static create(muya: Muya, state: ICodeBlockState) {
        const code = new Code(muya);

        code.append(ScrollPage.loadBlock('codeblock.content').create(muya, state));

        return code;
    }

    override get path() {
        const { path: pPath } = this.parent!;

        return [...pPath];
    }

    constructor(muya: Muya) {
        super(muya);
        this.tagName = 'code';
        this.classList = ['mu-code'];
        this.createDomNode();
        this.createCopyNode();
        this.listen();
    }

    override getState(): TState {
        debug.warn('You can never call `getState` in code');
        return {} as TState;
    }

    // Create the copy button at the top-right.
    createCopyNode() {
        const { i18n } = this.muya;
        this.domNode!.innerHTML = toHTML(renderCopyButton(i18n));
    }

    listen() {
        const { eventCenter, editor } = this.muya;
        // Copy code content to clipboard.
        const clickHandler = (event: Event) => {
            event.preventDefault();
            event.stopPropagation();

            const codeContent = this.firstContentInDescendant();

            if (codeContent == null) {
                debug.error('Has no code content');
                return;
            }

            editor.clipboard.copy('copyCodeContent', codeContent.text);
        };

        const mousedownHandler = (event: Event) => {
            event.preventDefault();
        };

        eventCenter.attachDOMEvent(
            this.domNode?.firstElementChild as HTMLElement,
            'click',
            clickHandler,
        );
        eventCenter.attachDOMEvent(
            this.domNode?.firstElementChild as HTMLElement,
            'mousedown',
            mousedownHandler,
        );
    }
}

export default Code;
