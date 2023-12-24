import Parent from '@muya/block/base/parent';
import { BLOCK_DOM_PROPERTY } from '@muya/config';
import Muya from '@muya/index';
import { Nullable } from '@muya/types';
import { isMouseEvent } from '@muya/utils';
import logger from '@muya/utils/logger';
import { TState } from '../../state/types';
import Content from '../base/content';
import { TBlockPath } from '../types';

const debug = logger('scrollpage:');

interface IBlurFocus {
  blur: Nullable<Content>;
  focus: Nullable<Content>;
}

class ScrollPage extends Parent {
  private _blurFocus: IBlurFocus = { blur: null, focus: null };

  static override blockName = 'scrollpage';

  static registeredBlocks = new Map();

  static register(Block: Parent | Content) {
    const { blockName } = Block;
    this.registeredBlocks.set(blockName, Block);
  }

  static loadBlock(blockName: string) {
    const block = this.registeredBlocks.get(blockName);

    if (!block) {
      debug.warn(`block:${blockName} is not existed.`);
    }

    return block;
  }

  static create(muya: Muya, state: TState[]) {
    const scrollPage = new ScrollPage(muya);

    scrollPage.append(
      ...state.map((block) => {
        return this.loadBlock(block.name).create(muya, block);
      })
    );

    scrollPage.parent!.domNode!.appendChild(scrollPage.domNode!);

    return scrollPage;
  }

  override get path() {
    return [];
  }

  constructor(muya: Muya) {
    super(muya);
    // muya is not extends Parent, but it is the parent of scrollPage.
    this.parent = muya as unknown as Parent;
    this.tagName = 'div';
    this.classList = ['mu-container'];

    this.createDomNode();
    this.listenDomEvent();
  }

  override getState() {
    debug.warn('You can never call `getState` in scrollPage');

    return {} as TState;
  }

  private listenDomEvent() {
    const { eventCenter } = this.muya;
    const { domNode } = this;

    eventCenter.attachDOMEvent(domNode!, 'click', this.clickHandler.bind(this));
  }

  updateState(state: TState[]) {
    const { muya } = this;
    // Empty scrollPage dom
    this.empty();
    this.append(
      ...state.map((block) => {
        return ScrollPage.loadBlock(block.name).create(muya, block);
      })
    );
  }

  /**
   * Find the content block by the path
   * @param {array} path
   */
  queryBlock(path: TBlockPath) {
    if (path.length === 0) {
      return this;
    }

    const p = path.shift() as number;
    const block = this.find(p) as Parent;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return block && path.length ? block.queryBlock(path) : block;
  }

  updateRefLinkAndImage(label: string) {
    const REG = new RegExp(`\\[${label}\\](?!:)`);

    this.breadthFirstTraverse((node) => {
      if (node.isContent() && REG.test(node.text)) {
        node.update();
      }
    });
  }

  handleBlurFromContent(block: Content) {
    this._blurFocus.blur = block;
    requestAnimationFrame(this.updateActiveStatus);
  }

  handleFocusFromContent(block: Content) {
    this._blurFocus.focus = block;
    requestAnimationFrame(this.updateActiveStatus);
  }

  private updateActiveStatus = () => {
    const { blur, focus } = this._blurFocus;

    if (blur == null && focus == null) {
      return;
    }

    let needBlurBlocks: Parent[] = [];
    let needFocusBlocks: Parent[] = [];
    let block;

    if (blur && focus) {
      needFocusBlocks = focus.getAncestors();
      block = blur.parent;
      while (block && block.isParent && block.isParent() && !needFocusBlocks.includes(block)) {
        needBlurBlocks.push(block);
        block = block.parent;
      }
    } else if (blur) {
      needBlurBlocks = blur.getAncestors();
    } else if (focus) {
      needFocusBlocks = focus.getAncestors();
    }

    if (needBlurBlocks.length) {
      needBlurBlocks.forEach((b) => {
        b.active = false;
      });
    }

    if (needFocusBlocks.length) {
      needFocusBlocks.forEach((b) => {
        b.active = true;
      });
    }

    this._blurFocus = {
      blur: null,
      focus: null,
    };
  };

  // Create a new paragraph if click the blank area in editor.
  private clickHandler(event: Event) {
    if (!isMouseEvent(event)) {
      return;
    }

    const target = event.target as HTMLElement;

    if (target && target[BLOCK_DOM_PROPERTY] === this) {
      const lastChild = this.lastChild as Parent;
      const lastContentBlock = lastChild.lastContentInDescendant()!;
      const { clientY } = event;
      const lastChildDom = lastChild.domNode;
      const { bottom } = lastChildDom!.getBoundingClientRect();

      if (clientY > bottom) {
        if (
          lastChild.blockName === 'paragraph' &&
          lastContentBlock.text === ''
        ) {
          lastContentBlock.setCursor(0, 0);
        } else {
          const state = {
            name: 'paragraph',
            text: '',
          };
          const newNode = ScrollPage.loadBlock(state.name).create(
            this.muya,
            state
          );
          this.append(newNode, 'user');
          const cursorBlock = newNode.lastContentInDescendant();
          cursorBlock.setCursor(0, 0, true);
        }
      }
    }
  }
}

export default ScrollPage;
