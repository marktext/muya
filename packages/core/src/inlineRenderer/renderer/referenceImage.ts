import { CLASS_NAMES } from '../../config';
import { getImageSrc } from '../../utils/image';
import type { ISyntaxRenderOptions, ReferenceImageToken } from '../types';
import type Renderer from './index';

// reference_image
export default function referenceImage(
    this: Renderer,
    {
        h,
        cursor,
        block,
        token,
        outerClass,
    }: ISyntaxRenderOptions & { token: ReferenceImageToken },
) {
    const className = this.getClassName(outerClass, block, token, cursor);
    const imageClass = CLASS_NAMES.MU_IMAGE_MARKED_TEXT;
    const { start, end } = token.range;
    const tag = this.highlight(h, block, start, end, token);
    const { label, backlash, alt } = token;
    const rawSrc = label + backlash.second;
    let href = '';
    let title = '';
    if (this.parent.labels.has(rawSrc.toLowerCase()))
        ({ href, title } = this.parent.labels.get(rawSrc.toLowerCase())!);

    const imageSrc = getImageSrc(href);
    const { src } = imageSrc;
    let id;
    let isSuccess;
    let selector;
    if (src) {
        ({ id, isSuccess } = this.loadImageAsync(
            imageSrc,
            { alt },
            className,
            CLASS_NAMES.MU_COPY_REMOVE,
        ));
    }
    selector = id ? `span#${id}.${imageClass}` : `span.${imageClass}`;
    selector += `.${CLASS_NAMES.MU_OUTPUT_REMOVE}`;
    if (isSuccess)
        selector += `.${className}`;
    else
        selector += `.${CLASS_NAMES.MU_IMAGE_FAIL}`;

    return isSuccess
        ? [
                h(selector, tag),
                h(`img.${CLASS_NAMES.MU_COPY_REMOVE}`, { props: { alt, src, title } }),
            ]
        : [h(selector, tag)];
}
