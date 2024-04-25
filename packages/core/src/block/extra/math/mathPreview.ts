import katex from 'katex';
import { fromEvent } from 'rxjs';
import Parent from '../../base/parent';
import type { Muya } from '../../../muya';
import logger from '../../../utils/logger';
import 'katex/dist/contrib/mhchem.min.js';
import type { IMathBlockState, TState } from '../../../state/types';

const debug = logger('mathPreview:');

class MathPreview extends Parent {
    public math: string;

    static override blockName = 'math-preview';

    static create(muya: Muya, state: IMathBlockState) {
        const mathBlock = new MathPreview(muya, state);

        return mathBlock;
    }

    override get path() {
        debug.warn('You can never call `get path` in htmlPreview');
        return [];
    }

    constructor(muya: Muya, { text }: IMathBlockState) {
        super(muya);
        this.tagName = 'div';
        this.math = text;
        this.classList = ['mu-math-preview'];
        this.attributes = {
            spellcheck: 'false',
            contenteditable: 'false',
        };
        this.createDomNode();
        this.attachDOMEvents();
        this.update();
    }

    override getState(): TState {
        debug.warn('You can never call `getState` in mathPreview');
        return {} as TState;
    }

    attachDOMEvents() {
        const clickObservable = fromEvent(this.domNode!, 'click');
        clickObservable.subscribe(this.clickHandler.bind(this));
    }

    clickHandler(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        const cursorBlock = this.parent!.firstContentInDescendant();
        cursorBlock?.setCursor(0, 0);
    }

    update(math = this.math) {
        if (this.math !== math)
            this.math = math;

        const { i18n } = this.muya;

        if (math) {
            try {
                const html = katex.renderToString(math, {
                    displayMode: true,
                });
                this.domNode!.innerHTML = html;
            }
            catch (err) {
                this.domNode!.innerHTML = `<div class="mu-math-error">&lt; ${i18n.t(
          'Invalid Mathematical Formula',
        )} &gt;</div>`;
            }
        }
        else {
            this.domNode!.innerHTML = `<div class="mu-empty">&lt; ${i18n.t(
        'Empty Mathematical Formula',
      )} &gt;</div>`;
        }
    }
}

export default MathPreview;
