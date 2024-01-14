import katex from 'katex';

export type MathToken = {
  type: 'inlineMath' | 'multiplemath';
  raw: string;
  text: string;
  displayMode: boolean;
  mathStyle?: '' | 'gitlab';
};

type Options = {
  throwOnError?: boolean;
  useKatexRender?: boolean;
};

const inlineStartRule = /(\s|^)\${1,2}(?!\$)/;
const inlineRule =
  /^(\${1,2})(?!\$)((?:\\.|[^\\\n])*?(?:\\.|[^\\\n$]))\1(?=[\s?!.,:]|$)/;
const blockRule = /^(\${1,2})\n((?:\\[^]|[^\\])+?)\n\1(?:\n|$)/;

const DEFAULT_OPTIONS = {
  throwOnError: false,
  useKatexRender: false,
};

export default function (options: Options = {}) {
  const opts = Object.assign({}, DEFAULT_OPTIONS, options);

  return {
    extensions: [
      inlineKatex(createRenderer(opts, false)),
      blockKatex(createRenderer(opts, true)),
    ],
  };
}

function createRenderer(options: Options, newlineAfter: boolean) {
  return (token: MathToken) => {
    const { useKatexRender, ...otherOpts } = options;
    const { type, text, displayMode, mathStyle } = token;
    if (useKatexRender) {
      return (
        katex.renderToString(text, {
          ...otherOpts,
          displayMode,
        }) + (newlineAfter ? '\n' : '')
      );
    } else {
      return type === 'inlineMath'
        ? `$${text}$`
        : `<pre class="multiple-math" data-math-style="${mathStyle}">${text}</pre>\n`;
    }
  };
}

function inlineKatex(renderer: (token: MathToken) => string) {
  return {
    name: 'inlineMath',
    level: 'inline' as const,
    start(src: string) {
      const match = src.match(inlineStartRule);
      if (!match) {
        return;
      }

      const index = (match.index || 0) + match[1].length;
      const possibleKatex = src.substring(index);

      if (possibleKatex.match(inlineRule)) {
        return index;
      }
    },
    tokenizer(src: string) {
      const match = src.match(inlineRule);
      if (match) {
        return {
          type: 'inlineMath',
          raw: match[0],
          text: match[2].trim(),
          displayMode: match[1].length === 2,
        };
      }
    },
    renderer,
  };
}

function blockKatex(renderer: (token: MathToken) => string) {
  return {
    name: 'multiplemath',
    level: 'block' as const,
    start(src: string) {
      return src.indexOf('\n$');
    },
    tokenizer(src: string) {
      const match = src.match(blockRule);
      if (match) {
        return {
          type: 'multiplemath',
          raw: match[0],
          text: match[2].trim(),
          displayMode: match[1].length === 2,
          mathStyle: '',
        };
      }
    },
    renderer,
  };
}
