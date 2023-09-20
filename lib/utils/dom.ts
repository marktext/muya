import type { Attributes, Datasets } from "./types";

type TCreateDomOptions = {
  classList: Array<string>;
  attributes: Attributes;
  datasets: Datasets;
};

export const createDomNode = (
  tagName: string,
  { classList = [], attributes = {}, datasets = {} }: TCreateDomOptions = {} as TCreateDomOptions
) => {
  const domNode = document.createElement(tagName);

  for (const className of classList) {
    domNode.classList.add(className);
  }

  for (const [key, value] of Object.entries(attributes)) {
    domNode.setAttribute(key, value.toString());
  }

  for (const [key, value] of Object.entries(datasets)) {
    domNode.dataset[key] = value.toString();
  }

  return domNode;
};

/**
 * [description `add` or `remove` className of element
 */
export const operateClassName = (
  element: HTMLElement,
  ctrl: "add" | "remove",
  className: string
) => {
  const existed = element.classList.contains(className);

  if ((ctrl === "add" && !existed) || (ctrl === "remove" && existed)) {
    element.classList[ctrl](className);
  }
};

export const insertBefore = (newNode: HTMLElement, originNode: HTMLElement) => {
  const parentNode = originNode.parentNode;
  if (parentNode) {
    parentNode.insertBefore(newNode, originNode);
  }
};

// DOM operations
export const insertAfter = (newNode: HTMLElement, originNode: HTMLElement) => {
  const parentNode = originNode.parentNode;

  if (!parentNode) {
    return;
  }

  if (originNode.nextSibling) {
    parentNode.insertBefore(newNode, originNode.nextSibling);
  } else {
    parentNode.appendChild(newNode);
  }
};
