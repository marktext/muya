/* eslint-disable @typescript-eslint/no-explicit-any */
import runSanitize, { Config } from "./dompurify";
import Selection from "@muya/selection";
import { EVENT_KEYS } from "@muya/config";
import Content from "@muya/block/base/content";
import type { Diff } from "fast-diff";

type Union = {
  start: number;
  end: number;
  active?: boolean;
};

// eslint-disable-next-line @typescript-eslint/ban-types
type Constructor = new (...args: any[]) => {};

type Defer = {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  promise: Promise<unknown>;
};

export const uniqueIdGenerator = function* () {
  let id = 0;

  while (true) {
    yield id++;
  }
};

const ID_PREFIX = "mu-";
const uniqueIdIterator = uniqueIdGenerator();

export const getUniqueId = () => `${ID_PREFIX}${uniqueIdIterator.next().value}`;

export const getLongUniqueId = () =>
  `${getUniqueId()}-${(+new Date()).toString(32)}`;

export const noop = () => {};

export const identity = <T>(i: T): T => i;

export const isOdd = (n: number) => Math.abs(n) % 2 === 1;

export const isEven = (n: number) => Math.abs(n) % 2 === 0;

export const isLengthEven = (str = "") => str.length % 2 === 0;

export const snakeToCamel = (name: string) => {
  return name.replace(/_([a-z])/g, (_p0, p1) => p1.toUpperCase());
};
/**
 *  Are two arrays have intersection
 */
export const conflict = (arr1: [number, number], arr2: [number, number]) =>
  !(arr1[1] < arr2[0] || arr2[1] < arr1[0]);

export const union = (
  { start: tStart, end: tEnd }: Union,
  { start: lStart, end: lEnd, active }: Union
) => {
  if (!(tEnd <= lStart || lEnd <= tStart)) {
    if (lStart < tStart) {
      return {
        start: tStart,
        end: tEnd < lEnd ? tEnd : lEnd,
        active,
      };
    } else {
      return {
        start: lStart,
        end: tEnd < lEnd ? tEnd : lEnd,
        active,
      };
    }
  }

  return null;
};

// https://github.com/jashkenas/underscore
// TODO: @jocs rewrite in the future.
export const throttle = (func: any, wait = 50) => {
  let context: any;
  let args: any;
  let result: any;
  let timeout: any = null;
  let previous = 0;
  const later = () => {
    previous = Date.now();
    timeout = null;
    result = func.apply(context, args);
    if (!timeout) {
      context = args = null;
    }
  };

  return function (this: any) {
    const now = Date.now();
    const remaining = wait - (now - previous);

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    context = this;
    // eslint-disable-next-line prefer-rest-params
    args = arguments;
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      result = func.apply(context, args);
      if (!timeout) {
        context = args = null;
      }
    } else if (!timeout) {
      timeout = setTimeout(later, remaining);
    }

    return result;
  };
};

export const deepClone = <T>(value: T): T => {
  return structuredClone(value);
};

export const escapeHTML = (str: string) =>
  str.replace(
    /[&<>'"]/g,
    (tag) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      }[tag] || tag)
  );

export const unescapeHTML = (str: string) =>
  str.replace(
    /(?:&amp;|&lt;|&gt;|&quot;|&#39;)/g,
    (tag) =>
      ({
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&#39;": "'",
        "&quot;": '"',
      }[tag] || tag)
  );

export const escapeInBlockHtml = (html: string) => {
  return html.replace(
    /(<(style|script|title)[^<>]*>)([\s\S]*?)(<\/\2>)/g,
    (_m, p1, _p2, p3, p4) => {
      return `${escapeHTML(p1)}${p3}${escapeHTML(p4)}`;
    }
  );
};

export const wordCount = (markdown: string) => {
  const paragraph = markdown.split(/\n{2,}/).filter((line) => line).length;
  let word = 0;
  let character = 0;
  let all = 0;

  const removedChinese = markdown.replace(/[\u4e00-\u9fa5]/g, "");
  const tokens = removedChinese.split(/[\s\n]+/).filter((t) => t);
  const chineseWordLength = markdown.length - removedChinese.length;
  word += chineseWordLength + tokens.length;
  character += tokens.reduce((acc, t) => acc + t.length, 0) + chineseWordLength;
  all += markdown.length;

  return { word, paragraph, character, all };
};

/**
 * [genUpper2LowerKeyHash generate constants map hash, the value is lowercase of the key,
 * also translate `_` to `-`]
 */
export const genUpper2LowerKeyHash = (
  keys: Array<string>
): Record<string, string> => {
  return keys.reduce((acc, key) => {
    const value = key.toLowerCase().replace(/_/g, "-");

    return Object.assign(acc, { [key]: value });
  }, {});
};

/**
 * generate constants map, the value is the key.
 */
export const generateKeyHash = (
  keys: Array<string>
): Record<string, string> => {
  return keys.reduce((acc, key) => {
    return Object.assign(acc, { [key]: key });
  }, {});
};

export const sanitize = (
  html: string,
  purifyOptions: Config,
  disableHtml: boolean
) => {
  if (disableHtml) {
    return runSanitize(escapeHTML(html), purifyOptions);
  } else {
    return runSanitize(escapeInBlockHtml(html), purifyOptions);
  }
};

/**
 * TODO: @jocs remove in the future, because it's not used.
 * @param ele
 * @param id
 * @returns
 */
export const getParagraphReference = (ele: HTMLElement, id: string) => {
  const { x, y, left, top, bottom, height } = ele.getBoundingClientRect();

  return {
    getBoundingClientRect() {
      return { x, y, left, top, bottom, height, width: 0, right: left };
    },
    clientWidth: 0,
    clientHeight: height,
    id,
  };
};

function visibleLength(str: string) {
  return [...new (Intl as any).Segmenter().segment(str)].length;
}

/**
 * transform diff to text-unicode op
 * @param {array} diffs
 */
export const diffToTextOp = (diffs: Array<Diff>) => {
  const op = [];

  for (const diff of diffs) {
    switch (diff[0]) {
      case -1:
        op.push({ d: diff[1] });
        break;

      case 0:
        op.push(visibleLength(diff[1]));
        break;

      case 1:
        op.push(diff[1]);
        break;

      default:
        break;
    }
  }

  let peak = op[op.length - 1];
  while (typeof peak === "number") {
    op.pop();
    peak = op[op.length - 1];
  }

  return op;
};

export const getCursorReference = () => {
  const rect = Selection.getCursorCoords();

  if (!rect) {
    return null;
  }

  return {
    getBoundingClientRect() {
      return rect;
    },
    clientWidth: rect.width,
    clientHeight: rect.height,
  };
};

// If the next block is header, put cursor after the `#{1,6} *`
export const adjustOffset = <T extends Content>(
  offset: number,
  block: T,
  event: KeyboardEvent
) => {
  if (
    block.parent?.blockName === "atx-heading" &&
    event.key === EVENT_KEYS.ArrowDown
  ) {
    const match = /^\s{0,3}(?:#{1,6})(?:\s{1,}|$)/.exec(block.text);
    if (match) {
      return match[0].length;
    }
  }

  return offset;
};

export const verticalPositionInRect = (event: MouseEvent, rect: DOMRect) => {
  const { clientY } = event;
  const { top, height } = rect;

  return clientY - top > height / 2 ? "down" : "up";
};

export const hasPick = (c: any) => c && (c.p != null || c.r !== undefined);

export const getDefer = () => {
  const defer: Defer = {} as Defer;
  const promise = new Promise((resolve, reject) => {
    defer.resolve = resolve;
    defer.reject = reject;
  });
  defer.promise = promise;

  return defer;
};

export const methodMixins =
  (...objects: Record<string, (...args: any[]) => any>[]) =>
  (constructor: Constructor) => {
    for (const object of objects) {
      Object.keys(object).forEach((name) => {
        Object.defineProperty(
          constructor.prototype,
          name,
          Object.getOwnPropertyDescriptor(object, name) || Object.create(null)
        );
      });
    }
  };

export const mixins =
  (...constructors: Constructor[]) =>
  (derivedCtor: Constructor) => {
    constructors.forEach((baseCtor) => {
      Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
        // Do not rewrite the constructor of derivedCtor.
        if (name === "constructor") {
          return;
        }
        Object.defineProperty(
          derivedCtor.prototype,
          name,
          Object.getOwnPropertyDescriptor(baseCtor.prototype, name) ||
            Object.create(null)
        );
      });
    });
  };

// narrowing Event type to KeyboardEvent.
export function isKeyboardEvent(event: Event): event is KeyboardEvent {
  return "key" in event;
}

// narrowing Event type to MouseEvent.
export function isMouseEvent(event: Event): event is MouseEvent {
  return "x" in event;
}
