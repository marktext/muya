import type { IAttributes, IDatasets } from './types';

interface ICreateDomOptions {
    classList: string[];
    attributes: IAttributes;
    datasets: IDatasets;
}

export function createDomNode(tagName: string, { classList = [], attributes = {}, datasets = {} }: ICreateDomOptions = {} as ICreateDomOptions) {
    const domNode = document.createElement(tagName);

    for (const className of classList)
        domNode.classList.add(className);

    for (const [key, value] of Object.entries(attributes))
        domNode.setAttribute(key, value.toString());

    for (const [key, value] of Object.entries(datasets))
        domNode.dataset[key] = value.toString();

    return domNode;
}

/**
 * [description `add` or `remove` className of element
 */
export function operateClassName(element: HTMLElement, ctrl: 'add' | 'remove', className: string) {
    const existed = element.classList.contains(className);

    if ((ctrl === 'add' && !existed) || (ctrl === 'remove' && existed))
        element.classList[ctrl](className);
}

export function insertBefore(newNode: HTMLElement, originNode: HTMLElement) {
    const parentNode = originNode.parentNode;
    if (parentNode)
        parentNode.insertBefore(newNode, originNode);
}

// DOM operations
export function insertAfter(newNode: HTMLElement, originNode: HTMLElement) {
    const parentNode = originNode.parentNode;

    if (!parentNode)
        return;

    if (originNode.nextSibling)
        parentNode.insertBefore(newNode, originNode.nextSibling);
    else
        parentNode.appendChild(newNode);
}
