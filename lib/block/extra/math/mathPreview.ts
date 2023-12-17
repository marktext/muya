import Parent from '@muya/block/base/parent';
import Muya from '@muya/index';
import logger from '@muya/utils/logger';
import katex from 'katex';
import 'katex/dist/contrib/mhchem.min.js';
import { IMathBlockState, TState } from '../../../state/types';

const debug = logger('mathPreview:');

class MathPreview extends Parent {
  public math: string;

  static blockName = 'math-preview';

  static create(muya: Muya, state: IMathBlockState) {
    const mathBlock = new MathPreview(muya, state);

    return mathBlock;
  }

  get path() {
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

  getState(): TState {
    debug.warn('You can never call `getState` in mathPreview');
    return {} as TState;
  }

  attachDOMEvents() {
    const { eventCenter } = this.muya;

    eventCenter.attachDOMEvent(
      this.domNode!,
      'click',
      this.clickHandler.bind(this)
    );
  }

  clickHandler(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    const cursorBlock = this.parent!.firstContentInDescendant();
    cursorBlock?.setCursor(0, 0);
  }

  update(math = this.math) {
    if (this.math !== math) {
      this.math = math;
    }

    const { i18n } = this.muya;

    if (math) {
      try {
        const html = katex.renderToString(math, {
          displayMode: true,
        });
        this.domNode!.innerHTML = html;
      } catch (err) {
        this.domNode!.innerHTML = `<div class="mu-math-error">&lt; ${i18n.t(
          'Invalid Mathematical Formula'
        )} &gt;</div>`;
      }
    } else {
      this.domNode!.innerHTML = `<div class="mu-empty">&lt; ${i18n.t(
        'Empty Mathematical Formula'
      )} &gt;</div>`;
    }
  }
}

export default MathPreview;
