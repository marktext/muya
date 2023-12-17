import Parent from '@muya/block/base/parent';
import ScrollPage from '@muya/block/scrollPage';
import Muya from '@muya/index';
import logger from '@muya/utils/logger';
import { IDiagramMeta, IDiagramState, TState } from '../../../state/types';

const debug = logger('diagramContainer:');

class DiagramContainer extends Parent {
  public meta: IDiagramMeta;
  static blockName = 'diagram-container';

  static create(muya: Muya, state: IDiagramState) {
    const diagramContainer = new DiagramContainer(muya, state);

    const code = ScrollPage.loadBlock('code').create(muya, state);

    diagramContainer.append(code);

    return diagramContainer;
  }

  get lang() {
    return this.meta.lang;
  }

  get path() {
    const { path: pPath } = this.parent!;

    return [...pPath];
  }

  constructor(muya: Muya, { meta }: IDiagramState) {
    super(muya);
    this.tagName = 'pre';
    this.meta = meta;
    this.classList = ['mu-diagram-container'];
    this.createDomNode();
  }

  getState(): TState {
    debug.warn('You can never call `getState` in diagramContainer');
    return {} as TState;
  }
}

export default DiagramContainer;
