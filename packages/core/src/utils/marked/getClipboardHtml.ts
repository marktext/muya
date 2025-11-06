import type { ILexOption } from './types';
import { marked } from 'marked';
import mathExtension from './extensions/math';
import superSubScriptExtension from './extensions/superSubscript';
import fm, { frontMatterRender } from './frontMatter';
import { DEFAULT_OPTIONS } from './options';
import walkTokens from './walkTokens';

export function getClipBoardHtml(src: string, options: ILexOption = {}) {
    options = Object.assign({}, DEFAULT_OPTIONS, options);
    const { frontMatter, math, isGitlabCompatibilityEnabled, superSubScript }
        = options;
    let html = '';

    marked.use({
        walkTokens: walkTokens({ math, isGitlabCompatibilityEnabled }),
    });

    if (math) {
        marked.use(
            mathExtension({
                throwOnError: false,
                useKatexRender: false,
            }),
        );
    }

    if (superSubScript)
        marked.use(superSubScriptExtension());

    if (frontMatter) {
        const { token, src: newSrc } = fm(src);
        if (token) {
            html = frontMatterRender(token);
            src = newSrc;
        }
    }

    html += marked(src);

    return html;
}
