import runSanitize from "./dompurify";
import Selection from "@/selection";
import { EVENT_KEYS } from "@/config";

const uniqueIdGenerator = () => {
  const ID_PREFIX = "mu-";
  let id = 0;

  return () => `${ID_PREFIX}${id++}`;
};

export const getUniqueId = uniqueIdGenerator();

export const getLongUniqueId = () =>
  `${getUniqueId()}-${(+new Date()).toString(32)}`;

export const isMetaKey = ({ key }) =>
  key === "Shift" || key === "Control" || key === "Alt" || key === "Meta";

export const noop = () => {};

export const identity = (i) => i;

export const isOdd = (number) => Math.abs(number) % 2 === 1;

export const isEven = (number) => Math.abs(number) % 2 === 0;

export const isLengthEven = (str = "") => str.length % 2 === 0;

export const snakeToCamel = (name) =>
  name.replace(/_([a-z])/g, (p0, p1) => p1.toUpperCase());
/**
 *  Are two arrays have intersection
 */
export const conflict = (arr1, arr2) =>
  !(arr1[1] < arr2[0] || arr2[1] < arr1[0]);

export const union = (
  { start: tStart, end: tEnd },
  { start: lStart, end: lEnd, active }
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
export const throttle = (func, wait = 50) => {
  let context;
  let args;
  let result;
  let timeout = null;
  let previous = 0;
  const later = () => {
    previous = Date.now();
    timeout = null;
    result = func.apply(context, args);
    if (!timeout) {
      context = args = null;
    }
  };

  return function () {
    const now = Date.now();
    const remaining = wait - (now - previous);

    context = this;
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

// simple implementation...
export const debounce = (func, wait = 50) => {
  let timer = null;

  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      func(...args);
    }, wait);
  };
};

export const deepCopyArray = (array) => {
  const result = [];
  const len = array.length;
  let i;

  for (i = 0; i < len; i++) {
    if (typeof array[i] === "object" && array[i] !== null) {
      if (Array.isArray(array[i])) {
        result.push(deepCopyArray(array[i]));
      } else {
        result.push(deepCopy(array[i]));
      }
    } else {
      result.push(array[i]);
    }
  }

  return result;
};

// TODO: @jocs rewrite deepCopy
export const deepCopy = (object) => {
  const obj = {};
  Object.keys(object).forEach((key) => {
    if (typeof object[key] === "object" && object[key] !== null) {
      if (Array.isArray(object[key])) {
        obj[key] = deepCopyArray(object[key]);
      } else {
        obj[key] = deepCopy(object[key]);
      }
    } else {
      obj[key] = object[key];
    }
  });

  return obj;
};

export const escapeHTML = (str) =>
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

export const unescapeHTML = (str) =>
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

export const escapeInBlockHtml = (html) => {
  return html.replace(
    /(<(style|script|title)[^<>]*>)([\s\S]*?)(<\/\2>)/g,
    (m, p1, p2, p3, p4) => {
      return `${escapeHTML(p1)}${p3}${escapeHTML(p4)}`;
    }
  );
};

export const wordCount = (markdown) => {
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
export const genUpper2LowerKeyHash = (keys) => {
  return keys.reduce((acc, key) => {
    const value = key.toLowerCase().replace(/_/g, "-");

    return Object.assign(acc, { [key]: value });
  }, {});
};

/**
 * generate constants map, the value is the key.
 */
export const generateKeyHash = (keys) => {
  return keys.reduce((acc, key) => {
    return Object.assign(acc, { [key]: key });
  }, {});
};

// mixins
export const mixins = (constructor, ...object) =>
  Object.assign(constructor.prototype, ...object);

export const sanitize = (html, purifyOptions, disableHtml) => {
  if (disableHtml) {
    return runSanitize(escapeHTML(html), purifyOptions);
  } else {
    return runSanitize(escapeInBlockHtml(html), purifyOptions);
  }
};

export const getParagraphReference = (ele, id) => {
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

function visibleLength(str) {
  return [...new (Intl as any).Segmenter().segment(str)].length;
}

/**
 * transform diff to text-unicode op
 * @param {array} diffs
 */
export const diffToTextOp = (diffs) => {
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

  return {
    getBoundingClientRect() {
      return rect;
    },
    clientWidth: rect.width,
    clientHeight: rect.height,
  };
};

// If the next block is header, put cursor after the `#{1,6} *`
export const adjustOffset = (offset, block, event) => {
  if (
    block.parent.blockName === "atx-heading" &&
    event.key === EVENT_KEYS.ArrowDown
  ) {
    const match = /^\s{0,3}(?:#{1,6})(?:\s{1,}|$)/.exec(block.text);
    if (match) {
      return match[0].length;
    }
  }

  return offset;
};

export const verticalPositionInRect = (event, rect) => {
  const { clientY } = event;
  const { top, height } = rect;

  return clientY - top > height / 2 ? "down" : "up";
};

export const hasPick = (c) => c && (c.p != null || c.r !== undefined);

export const getDefer = () => {
  const defer: any = {};
  const promise = new Promise((resolve, reject) => {
    defer.resolve = resolve;
    defer.reject = reject;
  });
  defer.promise = promise;

  return defer;
};
