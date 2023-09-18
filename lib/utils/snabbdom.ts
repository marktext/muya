import {
  init,
  classModule,
  attributesModule,
  datasetModule,
  propsModule,
  styleModule,
  eventListenersModule,
  h as sh,
  toVNode as sToVNode,
} from "snabbdom";
import sToHTML from "snabbdom-to-html";

export const patch = init([
  classModule,
  attributesModule,
  styleModule,
  propsModule,
  datasetModule,
  eventListenersModule,
]);

export const h = sh;
export const toVnode = sToVNode;

export const toHTML = sToHTML; // helper function for convert vnode to HTML string
export const htmlToVNode = (html: string) => {
  // helper function for convert html to vnode
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;

  return toVnode(wrapper).children;
};
