import Parent from '@muya/block/base/parent';
import ScrollPage from '@muya/block/scrollPage';
import { TPathList } from '@muya/block/types';
import Muya from '@muya/index';
import logger from '@muya/utils/logger';
import { loadLanguage } from '@muya/utils/prism';
import { IDiagramMeta, IDiagramState } from '../../../state/types';

const debug = logger('diagram:');

class DiagramBlock extends Parent {
  public meta: IDiagramMeta;
  static blockName = 'diagram';

  static create(muya: Muya, state: IDiagramState) {
    const diagramBlock = new DiagramBlock(muya, state);
    const { lang } = state.meta;
    const diagramPreview = ScrollPage.loadBlock('diagram-preview').create(
      muya,
      state
    );
    const diagramContainer = ScrollPage.loadBlock('diagram-container').create(
      muya,
      state
    );

    diagramBlock.appendAttachment(diagramPreview);
    diagramBlock.append(diagramContainer);

    !!lang &&
      loadLanguage(lang)
        .then((infoList) => {
          if (!Array.isArray(infoList)) return;
          // There are three status `loaded`, `noexist` and `cached`.
          // if the status is `loaded`, indicated that it's a new loaded language
          const needRender = infoList.some(
            ({ status }) => status === 'loaded' || status === 'cached'
          );
          if (needRender) {
            diagramBlock.lastContentInDescendant().update();
          }
        })
        .catch((err) => {
          // if no parameter provided, will cause error.
          debug.warn(err);
        });

    return diagramBlock;
  }

  get path() {
    const { path: pPath } = this.parent!;
    const offset = this.parent!.offset(this);

    return [...pPath, offset];
  }

  constructor(muya: Muya, { meta }: IDiagramState) {
    super(muya);
    this.tagName = 'figure';
    this.meta = meta;
    this.classList = ['mu-diagram-block'];
    this.createDomNode();
  }

  queryBlock(path: TPathList) {
    return path.length && path[0] === 'text'
      ? this.firstContentInDescendant()
      : this;
  }

  getState(): IDiagramState {
    const { meta } = this;
    const { text } = this.firstContentInDescendant();

    return {
      name: 'diagram',
      text,
      meta,
    };
  }
}

export default DiagramBlock;
