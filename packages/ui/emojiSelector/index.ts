import BaseScrollFloat from '@muya/ui/baseScrollFloat';
import { h, patch } from '@muya/utils/snabbdom';
import Emoji from './emoji';

import type { Emoji as EmojiType } from '@muya/config/emojis';
import type Muya from '@muya/index';
import type { VNode } from 'snabbdom';
import './index.css';

const defaultOptions = {
  placement: 'bottom' as const,
  modifiers: {
    offset: {
      offset: '0, 12',
    },
  },
  showArrow: false,
};

class EmojiSelector extends BaseScrollFloat {
  static pluginName = 'emojiPicker';
  private _renderObj: Record<string, EmojiType[]> | null = null;
  private oldVNode: VNode | null = null;
  private emoji: Emoji = new Emoji();
  public override renderArray: EmojiType[] = [];
  public override activeItem: EmojiType | null = null;

  constructor(muya: Muya) {
    const name = 'mu-emoji-picker';
    super(muya, name, defaultOptions);

    this.listen();
  }

  get renderObj(): Record<string, EmojiType[]> {
    return this._renderObj || {};
  }

  set renderObj(obj: Record<string, EmojiType[]>) {
    this._renderObj = obj;
    const renderArray: EmojiType[] = [];
    Object.keys(obj).forEach((key) => {
      renderArray.push(...obj[key]);
    });
    this.renderArray = renderArray;
    if (this.renderArray.length > 0) {
      this.activeItem = this.renderArray[0];
      const activeEle = this.getItemElement(this.activeItem);
      this.activeEleScrollIntoView(activeEle);
    }
  }

  override listen() {
    super.listen();
    const { eventCenter } = this.muya;
    eventCenter.on('muya-emoji-picker', ({ reference, emojiText, block }) => {
      if (!emojiText) return this.hide();
      const text = emojiText.trim();
      if (text) {
        this.renderObj = this.emoji.search(text);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cb: any = (item: EmojiType) => {
          if (block && block.setEmoji) {
            block.setEmoji(item.aliases[0]);
          }
        };

        if (this.renderArray.length) {
          this.show(reference, cb);
          this.render();
        } else {
          this.hide();
        }
      }
    });
  }

  render() {
    const { scrollElement, renderObj, activeItem, oldVNode } = this;
    const { i18n } = this.muya;

    const children = Object.keys(renderObj).map((category) => {
      const title = h('div.title', i18n.t(category) || category);
      const emojis = renderObj[category].map((e: EmojiType) => {
        const selector = activeItem === e ? 'div.item.active' : 'div.item';

        return h(
          selector,
          {
            dataset: { label: e.aliases[0] },
            props: { title: e.description },
            on: {
              click: () => {
                this.selectItem(e);
              },
            },
          },
          h('span', e.emoji)
        );
      });

      return h('section', [title, h('div.emoji-wrapper', emojis)]);
    });

    const vnode = h('div', children);

    if (oldVNode) {
      patch(oldVNode, vnode);
    } else {
      patch(scrollElement!, vnode);
    }
    this.oldVNode = vnode;
  }

  getItemElement(item: EmojiType) {
    const label = item.aliases[0];

    return this.floatBox!.querySelector(`[data-label="${label}"]`) as HTMLElement;
  }

  override destroy() {
    super.destroy();
    this.emoji.destroy();
  }
}

export default EmojiSelector;
