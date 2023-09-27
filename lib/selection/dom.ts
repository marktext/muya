// utils used in selection/index.js
import { CLASS_NAMES } from "@muya/config";

export const isContentDOM = (element: HTMLElement) => {
  return (
    element &&
    element.tagName === "SPAN" &&
    element.classList.contains("mu-content")
  );
};

export const findContentDOM = (node: Node | null) => {
  if (!node) {
    return null;
  }

  do {
    if (node instanceof HTMLElement && isContentDOM(node)) {
      return node;
    }
    node = node.parentNode;
  } while (node);

  return null;
};

export const compareParagraphsOrder = (paragraph1: HTMLElement, paragraph2: HTMLElement) => {
  return (
    paragraph1.compareDocumentPosition(paragraph2) &
    Node.DOCUMENT_POSITION_FOLLOWING
  );
};

export const getTextContent = (node: Node, blackList: string[]) => {
  if (node.nodeType === 3 || !blackList) {
    return node.textContent;
  }

  let text = "";
  if (
    blackList.some(
      (className) => node.classList && node.classList.contains(className)
    )
  ) {
    return text;
  }

  if (node.nodeType === 3) {
    text += node.textContent;
  } else if (
    node.nodeType === 1 &&
    node.classList.contains(`${CLASS_NAMES.MU_INLINE_IMAGE}`)
  ) {
    // handle inline image
    const raw = node.getAttribute("data-raw");
    const imageContainer = node.querySelector(
      `.${CLASS_NAMES.MU_IMAGE_CONTAINER}`
    );
    const hasImg = imageContainer.querySelector("img");
    const childNodes = imageContainer.childNodes;
    if (childNodes.length && hasImg) {
      for (const child of childNodes) {
        if (child.nodeType === 1 && child.nodeName === "IMG") {
          text += raw;
        } else if (child.nodeType === 3) {
          text += child.textContent;
        }
      }
    } else {
      text += raw;
    }
  } else {
    const childNodes = node.childNodes;

    for (const n of childNodes) {
      text += getTextContent(n, blackList);
    }
  }

  return text;
};

export const getOffsetOfParagraph = (node: Node, paragraph: HTMLElement) => {
  let offset = 0;
  let preSibling = node;

  if (node === paragraph) return offset;

  do {
    preSibling = preSibling.previousSibling;
    if (preSibling) {
      offset += getTextContent(preSibling, [
        CLASS_NAMES.MU_MATH_RENDER,
        CLASS_NAMES.MU_RUBY_RENDER,
      ]).length;
    }
  } while (preSibling);

  return node === paragraph || node.parentNode === paragraph
    ? offset
    : offset + getOffsetOfParagraph(node.parentNode, paragraph);
};
