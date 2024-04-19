// eslint-disable-next-line ts/ban-ts-comment
// @ts-nocheck

import BaseFloat from '../baseFloat';
import { h, patch } from '../../utils/snabbdom';
import icons from './config';

import './index.css';

const defaultOptions = {
    placement: 'bottom' as const,
    modifiers: {
        offset: {
            offset: '0, 5',
        },
    },
    showArrow: false,
};

class LinkTools extends BaseFloat {
    static pluginName = 'linkTools';

    constructor(muya, options = {}) {
        const name = 'mu-link-tools';
        const opts = Object.assign({}, defaultOptions, options);
        super(muya, name, opts);
        this.oldVNode = null;
        this.linkInfo = null;
        this.options = opts;
        this.icons = icons;
        this.hideTimer = null;
        const linkContainer = (this.linkContainer = document.createElement('div'));
        this.container.appendChild(linkContainer);
        this.listen();
    }

    listen() {
        const { eventCenter } = this.muya;
        super.listen();
        eventCenter.subscribe('muya-link-tools', ({ reference, linkInfo }) => {
            if (reference) {
                this.linkInfo = linkInfo;
                setTimeout(() => {
                    this.show(reference);
                    this.render();
                }, 0);
            }
            else {
                if (this.hideTimer)
                    clearTimeout(this.hideTimer);

                this.hideTimer = setTimeout(() => {
                    this.hide();
                }, 500);
            }
        });

        const mouseOverHandler = () => {
            if (this.hideTimer)
                clearTimeout(this.hideTimer);
        };

        const mouseOutHandler = () => {
            this.hide();
        };

        eventCenter.attachDOMEvent(this.container, 'mouseover', mouseOverHandler);
        eventCenter.attachDOMEvent(this.container, 'mouseleave', mouseOutHandler);
    }

    render() {
        const { icons, oldVNode, linkContainer } = this;
        const children = icons.map((i) => {
            let icon;
            let iconWrapperSelector;
            if (i.icon) {
                // SVG icon Asset
                iconWrapperSelector = 'div.icon-wrapper';
                icon = h(
                    'i.icon',
                    h(
                        'i.icon-inner',
                        {
                            style: {
                                'background': `url(${i.icon}) no-repeat`,
                                'background-size': '100%',
                            },
                        },
                        '',
                    ),
                );
            }
            const iconWrapper = h(iconWrapperSelector, icon);
            const itemSelector = `li.item.${i.type}`;

            return h(
                itemSelector,
                {
                    on: {
                        click: (event) => {
                            this.selectItem(event, i);
                        },
                    },
                },
                iconWrapper,
            );
        });

        const vnode = h('ul', children);

        if (oldVNode)
            patch(oldVNode, vnode);
        else
            patch(linkContainer, vnode);

        this.oldVNode = vnode;
    }

    selectItem(event, item) {
        event.preventDefault();
        event.stopPropagation();
        const { contentState } = this.muya;
        switch (item.type) {
            case 'unlink':
                contentState.unlink(this.linkInfo);
                this.hide();
                break;

            case 'jump':
                this.options.jumpClick(this.linkInfo);
                this.hide();
                break;
        }
    }
}

export default LinkTools;
