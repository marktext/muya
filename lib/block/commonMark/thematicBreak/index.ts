import Parent from '@muya/block/base/parent';
import ThematicBreakContent from '@muya/block/content/thematicBreakContent';
import LeafQueryBlock from '@muya/block/mixins/leafQueryBlock';
import ScrollPage from '@muya/block/scrollPage';
import Muya from '@muya/index';
import { mixins } from '@muya/utils';
import { IThematicBreakState } from '../../../state/types';

@mixins(LeafQueryBlock)
class ThematicBreak extends Parent {
  static override blockName = 'thematic-break';

  static create(muya: Muya, state: IThematicBreakState) {
    const heading = new ThematicBreak(muya);

    heading.append(
      ScrollPage.loadBlock('thematicbreak.content').create(muya, state.text)
    );

    return heading;
  }

  override get path() {
    const { path: pPath } = this.parent!;
    const offset = this.parent!.offset(this);

    return [...pPath, offset];
  }

  constructor(muya: Muya) {
    super(muya);
    this.tagName = 'p';
    this.classList = ['mu-thematic-break'];
    this.createDomNode();
  }

  override getState(): IThematicBreakState {
    return {
      name: 'thematic-break',
      text: (this.children.head as ThematicBreakContent).text,
    };
  }
}

export default ThematicBreak;
