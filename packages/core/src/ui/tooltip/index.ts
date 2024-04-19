// eslint-disable-next-line ts/ban-ts-comment
// @ts-nocheck

import './index.css';
import type { Muya } from '../../index';

function position(source, ele) {
    const rect = source.getBoundingClientRect();
    const { top, right, height } = rect;

    Object.assign(ele.style, {
        top: `${top + height + 15}px`,
        left: `${right - ele.offsetWidth / 2 - 10}px`,
    });
}

class Tooltip {
    private muya: Muya;
    private cache: WeakMap<HTMLElement, HTMLElement>;

    constructor(muya) {
        this.muya = muya;
        this.cache = new WeakMap();
        const { domNode, eventCenter } = this.muya;

        eventCenter.attachDOMEvent(
            domNode,
            'mouseover',
            this.mouseOver.bind(this),
        );
    }

    mouseOver(event) {
        const { target } = event;
        const toolTipTarget = target.closest('[data-tooltip]');
        const { eventCenter } = this.muya;
        if (toolTipTarget && !this.cache.has(toolTipTarget)) {
            const tooltip = toolTipTarget.getAttribute('data-tooltip');
            const tooltipEle = document.createElement('div');
            tooltipEle.textContent = tooltip;
            tooltipEle.classList.add('mu-tooltip');
            document.body.appendChild(tooltipEle);
            position(toolTipTarget, tooltipEle);

            this.cache.set(toolTipTarget, tooltipEle);

            setTimeout(() => {
                tooltipEle.classList.add('active');
            });

            const timer = setInterval(() => {
                if (!document.body.contains(toolTipTarget)) {
                    this.mouseLeave({ target: toolTipTarget });
                    clearInterval(timer);
                }
            }, 300);

            eventCenter.attachDOMEvent(
                toolTipTarget,
                'mouseleave',
                this.mouseLeave.bind(this),
            );
        }
    }

    mouseLeave(event) {
        const { target } = event;
        if (this.cache.has(target)) {
            const tooltipEle = this.cache.get(target);
            tooltipEle.remove();
            this.cache.delete(target);
        }
    }
}

export default Tooltip;
