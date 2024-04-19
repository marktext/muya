import type { Token, Tokens } from 'marked';
import type { IMathToken } from './extensions/math';
import type { Heading, ILexOption } from './types';

function isHeadingToken(token: Token | Heading): token is Heading {
    return token.type === 'heading';
}

function isMathToken(token: Token | IMathToken): token is IMathToken {
    return token.type === 'code' && token.lang === 'math';
}

function walkTokens(options: ILexOption) {
    return (token: Token | Heading) => {
        const { math, isGitlabCompatibilityEnabled } = options;
        // marked mixes atx and setext headers, which we distinguish by headingStyle,
        // and markers are unique to setext heading
        if (isHeadingToken(token)) {
            const matches = /\n {0,3}(=+|-+)/.exec(token.raw);
            token.headingStyle = matches ? 'setext' : 'atx';
            token.marker = matches ? matches[1] : '';
        }

        if (token.type === 'code') {
            if (token.codeBlockStyle)
                token.lang = '';
            else if (typeof token.lang === 'string')
                token.codeBlockStyle = 'fenced';
        }

        if (isMathToken(token) && math && isGitlabCompatibilityEnabled) {
            token.type = 'multiplemath';
            token.mathStyle = 'gitlab';
            token.displayMode = true;
            delete (token as unknown as Tokens.Code).lang;
            delete (token as unknown as Tokens.Code).codeBlockStyle;
        }
    };
}

export default walkTokens;
