import Content from '../../base/content';
import type CodeBlock from '../../commonMark/codeBlock';
import type { Muya } from '../../../muya';
import type { ICursor } from '../../../selection/types';
import type { ICodeBlockState } from '../../../state/types';
import { getHighlightHtml } from '../../../utils/highlightHTML';

class LangInputContent extends Content {
    public override parent: CodeBlock | null = null;

    static override blockName = 'language-input';

    static create(muya: Muya, state: ICodeBlockState) {
        const content = new LangInputContent(muya, state);

        return content;
    }

    constructor(muya: Muya, { meta }: ICodeBlockState) {
        super(muya, meta.lang);
        this.classList = [...this.classList, 'mu-language-input'];
        this.attributes.hint = muya.i18n.t('Input Language Identifier...');
        this.createDomNode();
    }

    override getAnchor() {
        return this.parent;
    }

    override update(_cursor?: ICursor, highlights = []) {
        this.domNode!.innerHTML = getHighlightHtml(this.text, highlights);
    }

    /**
     * Update this block lang and parent's lang, and show/hide language selector.
     * @param lang
     */
    updateLanguage(lang: string) {
        const { start, end } = this.getCursor()!;
        this.text = lang;
        this.parent!.lang = lang;
        const startOffset = Math.min(lang.length, start.offset);
        const endOffset = Math.min(lang.length, end.offset);
        this.setCursor(startOffset, endOffset, true);
        this.muya.eventCenter.emit('content-change', { block: this });
    }

    override inputHandler() {
        const textContent = this.domNode!.textContent ?? '';
        const lang = textContent.split(/\s+/)[0];
        this.updateLanguage(lang);
    }

    override enterHandler(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        const { parent } = this;
        parent!.lastContentInDescendant()?.setCursor(0, 0);
    }

    override backspaceHandler(event: Event) {
        const { start, end } = this.getCursor()!;
        const { text } = this;
        // The next if statement is used to fix Firefox compatibility issues
        if (start.offset === 1 && end.offset === 1 && text.length === 1) {
            event.preventDefault();
            const lang = '';
            this.updateLanguage(lang);
        }
        if (start.offset === 0 && end.offset === 0) {
            event.preventDefault();
            const cursorBlock = this.previousContentInContext();
            // The cursorBlock will be null, if the code block is the first block in doc.
            if (cursorBlock) {
                const offset = cursorBlock.text.length;
                cursorBlock.setCursor(offset, offset, true);
            }
        }
    }
}

export default LangInputContent;
