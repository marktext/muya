import diff from 'fast-diff';
import Parent from '../../base/parent';
import ScrollPage from '../../scrollPage';
import type { Muya } from '../../../muya';
import { diffToTextOp } from '../../../utils';
import { operateClassName } from '../../../utils/dom';
import logger from '../../../utils/logger';
import { loadLanguage } from '../../../utils/prism';
import type { ICodeBlockState } from '../../../state/types';
import type { TBlockPath } from '../../types';

const debug = logger('codeblock:');

class CodeBlock extends Parent {
    public meta: ICodeBlockState['meta'];
    static override blockName = 'code-block';

    static create(muya: Muya, state: ICodeBlockState) {
        const codeBlock = new CodeBlock(muya, state);
        const { lang } = state.meta;

        const langInput = ScrollPage.loadBlock('language-input').create(
            muya,
            state,
        );
        const code = ScrollPage.loadBlock('code').create(muya, state);

        codeBlock.append(langInput);
        codeBlock.append(code);

        if (lang) {
            requestAnimationFrame(() => {
                codeBlock.lang = lang;
            });
        }

        return codeBlock;
    }

    get lang() {
        return this.meta.lang;
    }

    set lang(value) {
        this.meta.lang = value;

        if (this.meta.type !== 'fenced') {
            this.meta.type = 'fenced';
            // dispatch change to modify json state
            const diffs = diff('indented', 'fenced');
            const { path } = this;
            path.push('meta', 'type');

            this.jsonState.editOperation(path, diffToTextOp(diffs));

            operateClassName(this.domNode!, 'remove', 'mu-indented-code');
            operateClassName(this.domNode!, 'add', 'mu-fenced-code');
        }

        !!value
        && loadLanguage(value)
            .then((infoList) => {
                if (!Array.isArray(infoList))
                    return;
                // There are three status `loaded`, `noexist` and `cached`.
                // if the status is `loaded`, indicated that it's a new loaded language
                const needRender = infoList.some(
                    ({ status }) => status === 'loaded' || status === 'cached',
                );
                if (needRender)
                    this.lastContentInDescendant()?.update();
            })
            .catch((err) => {
                // if no parameter provided, will cause error.
                debug.warn(err);
            });
    }

    override get path(): TBlockPath {
        const { path: pPath } = this.parent!;
        const offset = this.parent!.offset(this);

        return [...pPath, offset];
    }

    constructor(muya: Muya, { meta }: ICodeBlockState) {
        super(muya);
        this.tagName = 'pre';
        this.meta = meta;
        this.classList = ['mu-code-block', `mu-${meta.type}-code`];
        this.createDomNode();
    }

    queryBlock(path: TBlockPath) {
        if (path.length === 0) {
            return this;
        }
        else {
            if (path[0] === 'meta' || path[0] === 'type')
                return this;
            else if (path[0] === 'lang')
                return this.firstContentInDescendant();
            else
                return this.lastContentInDescendant();
        }
    }

    override getState(): ICodeBlockState {
        const state: ICodeBlockState = {
            name: 'code-block',
            meta: { ...this.meta },
            text: this.lastContentInDescendant()!.text,
        };

        return state;
    }
}

export default CodeBlock;
