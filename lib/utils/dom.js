export const createDomNode = (tagName, { classList = [], attributes = {}, datasets = {} } = {}) => {
  const domNode = document.createElement(tagName)

  for (const className of classList) {
    domNode.classList.add(className)
  }

  for (const [key, value] of Object.entries(attributes)) {
    domNode.setAttribute(key, value)
  }

  for (const [key, value] of Object.entries(datasets)) {
    domNode.dataset[key] = value
  }

  return domNode
}

/**
 * [description `add` or `remove` className of element
 */
export const operateClassName = (element, ctrl, className) => {
  const existed = element.classList.contains(className)

  if (ctrl === 'add' && !existed || ctrl === 'remove' && existed) {
    element.classList[ctrl](className)
  }
}

export const insertBefore = (newNode, originNode) => {
  const parentNode = originNode.parentNode
  parentNode.insertBefore(newNode, originNode)
}

// DOM operations
export const insertAfter = (newNode, originNode) => {
  const parentNode = originNode.parentNode

  if (originNode.nextSibling) {
    parentNode.insertBefore(newNode, originNode.nextSibling)
  } else {
    parentNode.appendChild(newNode)
  }
}
