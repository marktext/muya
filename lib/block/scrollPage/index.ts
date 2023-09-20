// @ts-nocheck
import Parent from "@muya/block/base/parent";
import logger from "@muya/utils/logger";
import { BLOCK_DOM_PROPERTY } from "@muya/config";
import { TState } from "../../jsonState/types";

const debug = logger("scrollpage:");

class ScrollPage extends Parent {
  public blurFocus: {
    blur: any;
    focus: any;
  };

  static blockName = "scrollpage";

  static blocks = new Map();

  static register(Block) {
    const { blockName } = Block;
    this.blocks.set(blockName, Block);
  }

  static loadBlock(blockName) {
    const block = this.blocks.get(blockName);
    if (!block) {
      debug.warn(`block:${blockName} is not existed.`);
    }

    return block;
  }

  static create(muya, state) {
    const scrollPage = new ScrollPage(muya);

    scrollPage.append(
      ...state.map((block) => {
        return this.loadBlock(block.name).create(muya, block);
      })
    );

    scrollPage.parent.domNode.appendChild(scrollPage.domNode);

    return scrollPage;
  }

  get path() {
    return [];
  }

  constructor(muya) {
    super(muya);
    this.parent = muya;
    this.tagName = "div";
    this.classList = ["mu-container"];
    this.blurFocus = {
      blur: null,
      focus: null,
    };
    this.createDomNode();
    this.listenDomEvent();
  }

  getState(): TState {
    debug.warn("You can never call `getState` in scrollPage");
    return;
  }

  listenDomEvent() {
    const { eventCenter } = this.muya;
    const { domNode } = this;
    eventCenter.attachDOMEvent(domNode, "click", this.clickHandler.bind(this));
  }

  updateState(state) {
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
  queryBlock(path) {
    if (path.length === 0) {
      return this;
    }

    const p = path.shift();
    const block = this.find(p);

    return block && path.length ? (block as any).queryBlock(path) : block;
  }

  updateRefLinkAndImage(label) {
    const REG = new RegExp(`\\[${label}\\](?!:)`);

    this.breadthFirstTraverse((node) => {
      if (node.isContent() && REG.test(node.text)) {
        node.update();
      }
    });
  }

  handleBlurFromContent(block) {
    this.blurFocus.blur = block;
    requestAnimationFrame(this.updateActiveStatus);
  }

  handleFocusFromContent(block) {
    this.blurFocus.focus = block;
    requestAnimationFrame(this.updateActiveStatus);
  }

  updateActiveStatus = () => {
    const { blur, focus } = this.blurFocus;

    if (!blur && !focus) {
      return;
    }

    let needBlurBlocks = [];
    let needFocusBlocks = [];
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

    this.blurFocus = {
      blur: null,
      focus: null,
    };
  };

  // Create a new paragraph if the blank area in editor
  clickHandler(event) {
    const { target } = event;
    if (target && target[BLOCK_DOM_PROPERTY] === this) {
      const lastChild = this.lastChild;
      const lastContentBlock = (lastChild as any).lastContentInDescendant();
      const { clientY } = event;
      const lastChildDom = lastChild.domNode;
      const { bottom } = lastChildDom.getBoundingClientRect();
      if (clientY > bottom) {
        if (
          lastChild.blockName === "paragraph" &&
          lastContentBlock.text === ""
        ) {
          lastContentBlock.setCursor(0, 0);
        } else {
          const state = {
            name: "paragraph",
            text: "",
          };
          const newNode = ScrollPage.loadBlock(state.name).create(
            this.muya,
            state
          );
          this.append(newNode, "user");
          const cursorBlock = newNode.lastContentInDescendant();
          cursorBlock.setCursor(0, 0, true);
        }
      }
    }
  }
}

export default ScrollPage;
