import { getUniqueId } from '../../utils';
import { loadImage } from '../../utils/image';
import { insertAfter, operateClassName } from '../../utils/dom';
import { CLASS_NAMES } from '../../config';
import type Renderer from './index';

export default function loadImageAsync(
    this: Renderer,
    imageInfo: {
        isUnknownType: boolean;
        src: string;
    },
    attrs: Record<string, string>,
    className?: string,
    imageClass?: string,
) {
    const { src, isUnknownType } = imageInfo;
    let id: string;
    let isSuccess: boolean | undefined;
    let w;
    let h;

    if (!this.loadImageMap.has(src)) {
        id = getUniqueId();
        loadImage(src, isUnknownType)
            .then(({ url, width, height }) => {
                const imageText: HTMLElement | null = document.querySelector(`#${id}`);
                const img = document.createElement('img');
                img.src = url;
                if (attrs.alt)
                    img.alt = attrs.alt.replace(/[`*{}[\]()#+\-.!_>~:|<>$]/g, '');
                if (attrs.title)
                    img.setAttribute('title', attrs.title);
                if (attrs.width && typeof attrs.width === 'number')
                    img.setAttribute('width', attrs.width);

                if (attrs.height && typeof attrs.height === 'number')
                    img.setAttribute('height', attrs.height);

                if (imageClass)
                    img.classList.add(imageClass);

                if (imageText) {
                    if (imageText.classList.contains(`${CLASS_NAMES.MU_INLINE_IMAGE}`)) {
                        const imageContainer = imageText.querySelector(
              `.${CLASS_NAMES.MU_IMAGE_CONTAINER}`,
                        );
                        const oldImage = imageContainer!.querySelector('img');
                        if (oldImage)
                            oldImage.remove();

                        imageContainer!.appendChild(img);
                        imageText.classList.remove('mu-image-loading');
                        imageText.classList.add('mu-image-success');
                    }
                    else {
                        insertAfter(img, imageText);
                        if (className)
                            operateClassName(imageText, 'add', className);
                    }
                }

                if (this.urlMap.has(src))
                    this.urlMap.delete(src);

                this.loadImageMap.set(src, {
                    id,
                    isSuccess: true,
                    width,
                    height,
                });
            })
            .catch(() => {
                const imageText: HTMLElement | null = document.querySelector(`#${id}`);
                if (imageText) {
                    operateClassName(imageText, 'remove', CLASS_NAMES.MU_IMAGE_LOADING);
                    operateClassName(imageText, 'add', CLASS_NAMES.MU_IMAGE_FAIL);
                    const image = imageText.querySelector('img');
                    if (image)
                        image.remove();
                }

                if (this.urlMap.has(src))
                    this.urlMap.delete(src);

                this.loadImageMap.set(src, {
                    id,
                    isSuccess: false,
                });
            });
    }
    else {
        const imageInfo = this.loadImageMap.get(src)!;
        id = imageInfo.id;
        isSuccess = imageInfo.isSuccess;
        w = imageInfo.width;
        h = imageInfo.height;
    }

    return { id, isSuccess, width: w, height: h };
}
