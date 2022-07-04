
import { isObject, isString } from "../shared/index";
import { createComponentInstance, setupComponent } from "./component";

export function render(vnode, container) {
  patch(vnode, container);
}

function patch(vnode: any, container: any) {
  isObject(vnode.type) && processComponent(vnode, container);
  isString(vnode.type) && processElement(vnode, container);
}

function processComponent(vnode: any, container: any) {
  mountComponent(vnode, container);
}

function mountComponent(vnode: any, container) {
  const instance = createComponentInstance(vnode);

  setupComponent(instance);
  setupRenderEffect(instance, container);
}
function processElement(vnode: any, container: any) {
  mountElement(vnode, container);
}
function mountElement(vnode: any, container:any) {
  const {type, props, children} = vnode;
  const el = document.createElement(type);
  if(isObject(props)){
    for (const key in props) {
      el.setAttribute(key, props[key]);
    }
  }
  isString(children) && (el.innerHTML = children);
  Array.isArray(children) && mountChildren(vnode, el);
  // if (isString(children)) {
  //   el.textContent = children;
  // } else if (Array.isArray(children)) {
  //   mountChildren(vnode, el);
  // }
  container.append(el);
}
function mountChildren(vnode, container) {
  vnode.children.forEach((v) => {
    patch(v, container);
  });
}

function setupRenderEffect(instance: any, container) {
  var subTree = instance.render();
  patch(subTree, container);
}