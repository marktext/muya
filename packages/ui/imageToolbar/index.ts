import { h, patch } from '@muya/utils/snabbdom';
import BaseFloat from '../baseFloat';
import icons, { Icon } from './config';

import Format from '@muya/block/base/format';
import Muya from '@muya/index';
import { ImageToken } from '@muya/inlineRenderer/types';
import type { ReferenceObject } from 'popper.js';
import { VNode } from 'snabbdom';
import './index.css';

const defaultOptions = {
  placement: 'top',
  modifiers: {
    offset: {
      offset: '0, 10',
    },
  },
  showArrow: false,
};

class ImageToolbar extends BaseFloat {
  static pluginName = 'imageToolbar';
  private oldVNode: VNode | null = null;
  private imageInfo: {
    token: ImageToken;
    imageId: string;
  } | null = null;
  private icons: Icon[] = icons;
  private reference: ReferenceObject | null = null;
  private block: Format | null = null;
  private toolbarContainer: HTMLDivElement = document.createElement('div');

  constructor(muya: Muya, options = {}) {
    const name = 'mu-image-toolbar';
    const opts = Object.assign({}, defaultOptions, options);

    super(muya, name, opts);

    this.container!.appendChild(this.toolbarContainer);
    this.floatBox!.classList.add('mu-image-toolbar-container');

    this.listen();
  }

  listen() {
    const { eventCenter } = this.muya;
    super.listen();
    eventCenter.on('muya-image-toolbar', ({ block, reference, imageInfo }) => {
      this.reference = reference;
      if (reference) {
        this.block = block;
        this.imageInfo = imageInfo;
        setTimeout(() => {
          this.show(reference);
          this.render();
        }, 0);
      } else {
        this.hide();
      }
    });
  }

  render() {
    const { icons, oldVNode, toolbarContainer, imageInfo } = this;
    const { i18n } = this.muya;
    const { attrs } = imageInfo!.token;
    const dataAlign = attrs['data-align'];
    const children = icons.map((i) => {
      const iconWrapperSelector = 'div.icon-wrapper';
      const icon = h(
        'i.icon',
        h(
          'i.icon-inner',
          {
            style: {
              background: `url(${i.icon}) no-repeat`,
              'background-size': '100%',
            },
          },
          ''
        )
      );
      const iconWrapper = h(iconWrapperSelector, icon);
      let itemSelector = `li.item.${i.type}`;

      if (i.type === dataAlign || (!dataAlign && i.type === 'inline')) {
        itemSelector += '.active';
      }

      return h(
        itemSelector,
        {
          dataset: {
            tip: i.tooltip,
          },
          attrs: {
            title: i18n.t(i.tooltip),
          },
          on: {
            click: (event) => {
              this.selectItem(event, i);
            },
          },
        },
        iconWrapper
      );
    });

    const vnode = h('ul', children);

    if (oldVNode) {
      patch(oldVNode, vnode);
    } else {
      patch(toolbarContainer, vnode);
    }
    this.oldVNode = vnode;
  }

  selectItem(event: Event, item: Icon) {
    event.preventDefault();
    event.stopPropagation();

    const { imageInfo } = this;

    switch (item.type) {
      // Delete image.
      case 'delete':
        this.block!.deleteImage(imageInfo!);
        // Hide image transformer
        this.muya.eventCenter.emit('muya-transformer', {
          reference: null,
        });

        return this.hide();

      // Edit image, for example: editor alt and title, replace image.
      case 'edit': {
        const rect = this.reference!.getBoundingClientRect();
        const reference = {
          getBoundingClientRect() {
            rect.height = 0;

            return rect;
          },
        };
        // Hide image resize bar
        this.muya.eventCenter.emit('muya-transformer', {
          reference: null,
        });

        this.muya.eventCenter.emit('muya-image-selector', {
          block: this.block,
          reference,
          imageInfo,
        });

        return this.hide();
      }

      case 'inline':
      // fall through
      case 'left':
      // fall through
      case 'center':
      // fall through
      case 'right': {
        this.block!.updateImage(this.imageInfo!, 'data-align', item.type);

        return this.hide();
      }
    }
  }
}

export default ImageToolbar;
