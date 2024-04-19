import type { VNode } from 'snabbdom';
import { CLASS_NAMES } from '../../config';
import { getImageSrc } from '../../utils/image';
import ImageIcon from '../../assets/icons/image/2.png';
import ImageFailIcon from '../../assets/icons/image_fail/2.png';
import DeleteIcon from '../../assets/icons/delete/2.png';
import type { H, ISyntaxRenderOptions, ImageToken } from '../types';
import type Renderer from './index';

function renderIcon(h: H, className: string, icon: string) {
    const selector = `a.${className}`;
    const iconVnode = h(
        'i.icon',
        h(
            'i.icon-inner',
            {
                style: {
                    'background': `url(${icon}) no-repeat`,
                    'background-size': '100%',
                },
            },
            '',
        ),
    );

    return h(selector, iconVnode);
}

// I don't want operate dom directly, is there any better way? need help!
export default function image(
    this: Renderer,
    { h, block, token }: ISyntaxRenderOptions & { token: ImageToken },
) {
    const imageSrc = getImageSrc(token.attrs.src);
    const { selectedImage } = this.muya.editor.selection;
    const { i18n } = this.muya;
    const data = {
        attrs: {
            'contenteditable': 'false',
            'empty-text': i18n.t('Click to add an image'),
            'fail-text': i18n.t('Load image failed'),
        },
        dataset: {
            raw: token.raw,
        },
    };
    let id: string = '';
    let isSuccess: boolean | undefined;
    let src = imageSrc.src;
    const alt = token.attrs.alt;
    const title = token.attrs.title;
    const width = token.attrs.width;
    const height = token.attrs.height;

    if (src)
        ({ id, isSuccess } = this.loadImageAsync(imageSrc, token.attrs));

    let wrapperSelector = id
        ? `span#${isSuccess ? `${id}_${token.range.start}` : id}.${
        CLASS_NAMES.MU_INLINE_IMAGE
      }`
        : `span.${CLASS_NAMES.MU_INLINE_IMAGE}`;

    const imageIcons = [
        renderIcon(h, 'mu-image-icon-success', ImageIcon),
        renderIcon(h, 'mu-image-icon-fail', ImageFailIcon),
        renderIcon(h, 'mu-image-icon-close', DeleteIcon),
    ];

    /**
     * The image is used to wrap the img element.
     * @param args
     * @returns
     */
    const renderImageContainer = (...args: VNode[]) => {
        const data = {};
        if (title) {
            Object.assign(data, {
                dataset: { title },
            });
        }

        return h(`span.${CLASS_NAMES.MU_IMAGE_CONTAINER}`, data, args);
    };

    if (typeof token.attrs['data-align'] === 'string')
        wrapperSelector += `.${token.attrs['data-align']}`;

    // the src image is still loading, so use the url Map base64.
    if (this.urlMap.has(src)) {
    // fix: it will generate a new id if the image is not loaded.
        if (
            selectedImage
            && selectedImage.token.attrs.src === src
            && selectedImage.imageId !== id
        )
            selectedImage.imageId = id;

        src = this.urlMap.get(src)!;
        isSuccess = true;
    }

    if (alt.startsWith('loading-')) {
        wrapperSelector += `.${CLASS_NAMES.MU_IMAGE_UPLOADING}`;
        Object.assign(data.dataset, {
            id: alt,
        });
        if (this.urlMap.has(alt)) {
            src = this.urlMap.get(alt)!;
            isSuccess = true;
        }
    }

    if (src) {
    // image is loading...
        if (typeof isSuccess === 'undefined')
            wrapperSelector += `.${CLASS_NAMES.MU_IMAGE_LOADING}`;
        else if (isSuccess === true)
            wrapperSelector += `.${CLASS_NAMES.MU_IMAGE_SUCCESS}`;
        else
            wrapperSelector += `.${CLASS_NAMES.MU_IMAGE_FAIL}`;

        // Add image selected class name.
        if (selectedImage) {
            const { imageId, block: SelectedImageBlock, token: selectedToken } = selectedImage;
            if (
                imageId === `${id}_${token.range.start}`
                && SelectedImageBlock === block
                && selectedToken.range.start === token.range.start
                && selectedToken.range.end === token.range.end
            )
                wrapperSelector += `.${CLASS_NAMES.MU_INLINE_IMAGE_SELECTED}`;
        }

        const renderImage = () => {
            const data = {
                props: {
                    alt: alt.replace(/[`*{}[\]()#+\-.!_>~:|<>$]/g, ''),
                    src,
                    title,
                },
            };

            if (typeof width === 'string' && width)
                Object.assign(data.props, { width });

            if (typeof height === 'string' && height)
                Object.assign(data.props, { height });

            return h('img', data);
        };

        return isSuccess
            ? [
                    h(wrapperSelector, data, [
                        ...imageIcons,
                        renderImageContainer(
                            // An image description has inline elements as its contents.
                            // When an image is rendered to HTML, this is used as the image’s alt attribute.
                            renderImage(),
                        ),
                    ]),
                ]
            : [h(wrapperSelector, data, [...imageIcons, renderImageContainer()])];
    }
    else {
        wrapperSelector += `.${CLASS_NAMES.MU_EMPTY_IMAGE}`;

        return [h(wrapperSelector, data, [...imageIcons, renderImageContainer()])];
    }
}
