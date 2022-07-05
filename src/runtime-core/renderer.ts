
import { isObject, isString } from "../shared/index";
import { createComponentInstance, setupComponent } from "./component";
import { createVNode } from "./vnode";

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
  console.log(instance,'instance1')
  setupComponent(instance);
  setupRenderEffect(instance, container,vnode);
}
function processElement(vnode: any, container: any) {
  mountElement(vnode, container);
}
function mountElement(vnode: any, container:any) {
  const {type, props, children} = vnode;
  const el = vnode.el = document.createElement(type);
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

function setupRenderEffect(instance: any, container,vnode:any) {
  // 调用时绑定到代理对象上
  const { proxy } = instance;
  var subTree = instance.render.call(proxy);
  patch(subTree, container);
  // 根节点的el  赋值给组件的虚拟节点上
  vnode.el = subTree.el;
}