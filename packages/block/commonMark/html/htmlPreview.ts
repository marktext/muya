import Parent from '@muya/block/base/parent';
import { PREVIEW_DOMPURIFY_CONFIG } from '@muya/config';
import Muya from '@muya/index';
import { sanitize } from '@muya/utils';
import { getImageSrc } from '@muya/utils/image';
import logger from '@muya/utils/logger';
import { IHtmlBlockState, TState } from '../../../state/types';

const debug = logger('htmlPreview:');

class HTMLPreview extends Parent {
  public html: string;

  static override blockName = 'html-preview';

  static create(muya: Muya, state: IHtmlBlockState) {
    const htmlBlock = new HTMLPreview(muya, state);

    return htmlBlock;
  }

  override get path() {
    debug.warn('You can never call `get path` in htmlPreview');
    return [];
  }

  constructor(muya: Muya, { text }: IHtmlBlockState) {
    super(muya);
    this.tagName = 'div';
    this.html = text;
    this.classList = ['mu-html-preview'];
    this.attributes = {
      spellcheck: 'false',
      contenteditable: 'false',
    };
    this.createDomNode();
    this.update();
  }

  update(html = this.html) {
    if (this.html !== html) {
      this.html = html;
    }

    const { disableHtml } = this.muya.options;
    const htmlContent = sanitize(html, PREVIEW_DOMPURIFY_CONFIG, disableHtml) as string;

    // handle empty html bock
    if (/^<([a-z][a-z\d]*)[^>]*?>(\s*)<\/\1>$/.test(htmlContent.trim())) {
      this.domNode!.innerHTML =
        '<div class="mu-empty">&lt;Empty HTML Block&gt;</div>';
    } else {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      const imgs = doc.documentElement.querySelectorAll('img');

      for (const img of imgs) {
        const src = img.getAttribute('src')!;
        const imageSrc = getImageSrc(src);
        img.setAttribute('src', imageSrc.src);
      }

      this.domNode!.innerHTML =
        doc.documentElement!.querySelector('body')!.innerHTML;
    }
  }

  override getState(): TState {
    debug.warn('You can never call `getState` in htmlPreview');
    return {} as TState;
  }
}

export default HTMLPreview;
