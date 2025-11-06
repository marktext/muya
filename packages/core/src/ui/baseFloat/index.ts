import type { ReferenceObject } from 'popper.js';
import type { Muya } from '../../index';
import type { IBaseOptions } from '../types';
import Popper from 'popper.js';
import { EVENT_KEYS } from '../../config';
import { isKeyboardEvent, noop } from '../../utils';

import './index.css';

function defaultOptions() {
    return {
        placement: 'bottom-start' as const,
        modifiers: {
            offset: {
                offset: '0, 12',
            },
        },
        showArrow: false,
    };
}

const BUTTON_GROUP = ['mu-table-drag-bar', 'mu-front-button'];

abstract class BaseFloat {
    public options: IBaseOptions;
    public status: boolean = false;
    public floatBox: HTMLElement | null = null;
    public container: HTMLElement | null = null;
    public popper: Popper | null = null;
    public lastScrollTop: number | null = null;
    public cb: (...args: unknown[]) => void = noop;
    private resizeObserver: ResizeObserver | null = null;

    constructor(public muya: Muya, public name: string, options = {}) {
        this.options = Object.assign({}, defaultOptions(), options);
        this.init();
    }

    init() {
        const floatBox = document.createElement('div');
        const container = document.createElement('div');
        // Use to remember which float container is shown.
        container.classList.add(this.name);
        container.classList.add('mu-float-container');
        floatBox.classList.add('mu-float-wrapper');

        floatBox.appendChild(container);
        document.body.appendChild(floatBox);

        this.floatBox = floatBox;
        this.container = container;

        // Since the size of the container is not fixed and changes according to the change of content,
        // the floatBox needs to set the size according to the container size
        const resizeObserver = (this.resizeObserver = new ResizeObserver(() => {
            const { offsetWidth, offsetHeight } = container;

            Object.assign(floatBox.style, {
                width: `${offsetWidth}px`,
                height: `${offsetHeight}px`,
            });

            this.popper && this.popper.update();
        }));

        resizeObserver.observe(container);
    }

    listen() {
        const { eventCenter, domNode } = this.muya;
        const { floatBox } = this;

        const keydownHandler = (event: Event) => {
            if (isKeyboardEvent(event) && event.key === EVENT_KEYS.Escape)
                this.hide();
        };

        /**
         * After the editor scrolls vertically beyond a certain range,
         * it means that the user's focus is no longer on the float box,
         * so the float box needs to be hidden.
         */
        // TODO: @JOCS, But now there is a problem, the container for scroll is indeterminate,
        // and currently the default scroll container is the parent element of the editor(muya.domNode)
        const scrollHandler = (event: Event) => {
            if (typeof this.lastScrollTop !== 'number') {
                this.lastScrollTop = (event.target as Element)?.scrollTop;

                return;
            }

            // only when scroll distance great than 50px, then hide the float box.
            if (
                this.status
                && event.target
                && Math.abs((event.target as Element).scrollTop - this.lastScrollTop) > 50
            ) {
                this.hide();
            }
        };

        eventCenter.attachDOMEvent(document, 'click', this.hide.bind(this));
        eventCenter.attachDOMEvent(floatBox!, 'click', (event) => {
            event.stopPropagation();
            event.preventDefault();
        });
        eventCenter.attachDOMEvent(domNode, 'keydown', keydownHandler);
        eventCenter.attachDOMEvent(domNode.parentElement!, 'scroll', scrollHandler);
    }

    hide() {
        if (!this.status)
            return;

        const { eventCenter } = this.muya;
        this.status = false;
        if (this.popper && this.popper.destroy)
            this.popper.destroy();

        this.cb = noop;
        this.lastScrollTop = null;
        if (BUTTON_GROUP.includes(this.name))
            eventCenter.emit('muya-float-button', this, false);
        else
            eventCenter.emit('muya-float', this, false);
    }

    show(reference: ReferenceObject, cb = noop) {
        const { floatBox } = this;
        const { eventCenter } = this.muya;
        const { placement, modifiers } = this.options;
        if (!floatBox) {
            throw new Error('The float box is not existed.');
            return;
        }
        if (this.popper && this.popper.destroy)
            this.popper.destroy();

        this.cb = cb;
        this.popper = new Popper(reference, floatBox, {
            placement,
            modifiers,
        });
        this.status = true;
        if (BUTTON_GROUP.includes(this.name))
            eventCenter.emit('muya-float-button', this, true);
        else
            eventCenter.emit('muya-float', this, true);
    }

    destroy() {
        if (this.container && this.resizeObserver)
            this.resizeObserver.unobserve(this.container);

        if (this.popper && this.popper.destroy)
            this.popper.destroy();

        this.floatBox?.remove();
    }
}

export default BaseFloat;
