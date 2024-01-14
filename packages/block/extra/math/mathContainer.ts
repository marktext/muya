import Parent from '@muya/block/base/parent';
import ScrollPage from '@muya/block/scrollPage';
import Muya from '@muya/index';
import logger from '@muya/utils/logger';
import { IMathBlockState, TState } from '../../../state/types';

const debug = logger('mathContainer:');

class MathContainer extends Parent {
  static override blockName = 'math-container';

  static create(muya: Muya, state: IMathBlockState) {
    const mathContainer = new MathContainer(muya);

    const code = ScrollPage.loadBlock('code').create(muya, state);

    mathContainer.append(code);

    return mathContainer;
  }

  get lang() {
    return 'latex';
  }

  override get path() {
    const { path: pPath } = this.parent!;

    return [...pPath];
  }

  constructor(muya: Muya) {
    super(muya);
    this.tagName = 'pre';
    this.classList = ['mu-math-container'];
    this.createDomNode();
  }

  override getState(): TState {
    debug.warn('You can never call `getState` in mathContainer');
    return {} as TState;
  }
}

export default MathContainer;
