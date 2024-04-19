import type { VNode } from 'snabbdom';
import { EVENT_KEYS, URL_REG, isWin } from '../../config';
import { getUniqueId, isKeyboardEvent } from '../../utils';
import { getImageInfo, getImageSrc } from '../../utils/image';
import { h, patch } from '../../utils/snabbdom';
import BaseFloat from '../baseFloat';
import type { IBaseOptions } from '../types';

import type Format from '../../block/base/format';
import type { Muya } from '../../index';
import type { ImageToken } from '../../inlineRenderer/types';
import './index.css';

interface IState {
    src: string;
    alt: string;
    title: string;
}

type Options = {
    imagePathPicker?: () => Promise<string>;
    imageAction?: (state: IState) => Promise<string>;
} & IBaseOptions;

const defaultOptions = {
    placement: 'bottom' as const,
    modifiers: {
        offset: {
            offset: '0, 0',
        },
    },
    showArrow: false,
};

export class ImageEditTool extends BaseFloat {
    public override options: Options;
    static pluginName = 'imageSelector';
    private oldVNode: VNode | null = null;
    private imageInfo: {
        token: ImageToken;
        imageId: string;
    } | null = null;

    private block: Format | null = null;
    private state: IState = {
        alt: '',
        src: '',
        title: '',
    };

    private imageSelectorContainer: HTMLDivElement
        = document.createElement('div');

    constructor(muya: Muya, options: Options = { ...defaultOptions }) {
        const name = 'mu-image-selector';
        super(muya, name, Object.assign({}, defaultOptions, options));
        // Why aren't options set on baseFloat?
        this.options = Object.assign({}, defaultOptions, options);
        this.container!.appendChild(this.imageSelectorContainer);
        this.floatBox!.classList.add('mu-image-selector-wrapper');
        this.listen();
    }

    override listen() {
        super.listen();
        const { eventCenter } = this.muya;
        eventCenter.on('muya-image-selector', ({ block, reference, imageInfo }) => {
            if (reference) {
                this.block = block;

                Object.assign(this.state, imageInfo.token.attrs);

                // Remove file protocol to allow autocomplete.
                // TODO: @JOCS, we still need these codes bellow?
                const imageSrc = this.state.src;
                if (imageSrc && /^file:\/\//.test(imageSrc)) {
                    let protocolLen = 7;
                    if (isWin && /^file:\/\/\//.test(imageSrc))
                        protocolLen = 8;

                    this.state.src = imageSrc.substring(protocolLen);
                }

                this.imageInfo = imageInfo;
                this.show(reference);
                this.render();

                // Auto focus and select all content of the `src.input` element.
                const input = this.container?.querySelector('input.src');
                if (input) {
                    (input as HTMLInputElement).focus();
                    (input as HTMLInputElement).select();
                }
            }
            else {
                this.hide();
            }
        });
    }

    handleSrcInput(event: Event) {
        const value = (event.target as HTMLInputElement).value;
        this.state.src = value;
    }

    handleEnter(event: Event) {
        if (!isKeyboardEvent(event))
            return;

        event.stopPropagation();
        if (event.key === EVENT_KEYS.Enter)
            this.handleConfirm();
    }

    handleConfirm() {
        return this.replaceImageAsync(this.state);
    }

    replaceImageAsync = async ({ alt, src, title }: IState) => {
        if (!this.options.imageAction || URL_REG.test(src)) {
            const {
                alt: oldAlt,
                src: oldSrc,
                title: oldTitle,
            } = this.imageInfo!.token.attrs;
            if (alt !== oldAlt || src !== oldSrc || title !== oldTitle)
                this.block!.replaceImage(this.imageInfo!, { alt, src, title });

            this.hide();
        }
        else {
            if (src) {
                const id = `loading-${getUniqueId()}`;
                this.block!.replaceImage(this.imageInfo!, {
                    alt: id,
                    src,
                    title,
                });
                this.hide();
                const nSrc = await this.options.imageAction({ src, title, alt });
                const { src: localPath } = getImageSrc(src);
                if (localPath)
                    this.muya.editor.inlineRenderer.renderer.urlMap.set(nSrc, localPath);

                const imageWrapper = this.muya.domNode.querySelector(
          `span[data-id=${id}]`,
                ) as HTMLElement;

                if (imageWrapper) {
                    const imageInfo = getImageInfo(imageWrapper);
                    this.block!.replaceImage(imageInfo, {
                        alt,
                        src: nSrc,
                        title,
                    });
                }
            }
            else {
                this.hide();
            }
        }
    };

    async handleMoreClick() {
        if (!this.options.imagePathPicker)
            return;

        const path = await this.options.imagePathPicker();
        this.state.src = path;

        this.render();
    }

    render() {
        const { oldVNode, imageSelectorContainer } = this;
        const { i18n } = this.muya;
        const { src } = this.state;

        const moreButton = this.options.imagePathPicker
            ? h(
                'span.more',
                {
                    on: {
                        click: () => {
                            this.handleMoreClick();
                        },
                    },
                },
                h('span.more-inner'),
            )
            : null;

        const srcInput = h('input.src', {
            props: {
                placeholder: i18n.t('Image src placeholder'),
                value: src,
            },
            on: {
                input: (event) => {
                    this.handleSrcInput(event);
                },
                paste: (event) => {
                    this.handleSrcInput(event);
                },
                keydown: (event) => {
                    this.handleEnter(event);
                },
            },
        });

        const confirmButton = h(
            'span.confirm',
            {
                on: {
                    click: () => {
                        this.handleConfirm();
                    },
                },
            },
            i18n.t('Confirm Text'),
        );

        const vnode = h('div.image-edit-tool', [
            moreButton,
            srcInput,
            confirmButton,
        ]);

        patch(oldVNode || imageSelectorContainer, vnode);

        this.oldVNode = vnode;
    }
}
