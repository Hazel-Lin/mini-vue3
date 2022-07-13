
import { isOn } from "../shared/index";
import { ShapeFlags } from "../shared/shapeFlags";
import { createComponentInstance, setupComponent } from "./component";

export function render(vnode, container) {
  patch(vnode, container);
}

function patch(vnode: any, container: any) {
  const { shapeFlag } = vnode;
  if (shapeFlag & ShapeFlags.ELEMENT) {
    processElement(vnode, container);
  }else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    processComponent(vnode, container);
  }
}

function processComponent(vnode: any, container: any) {
  mountComponent(vnode, container);
}

function mountComponent(vnode: any, container) {
  const instance = createComponentInstance(vnode);
  setupComponent(instance);
  setupRenderEffect(instance, container,vnode);
}
function processElement(vnode: any, container: any) {
  mountElement(vnode, container);
}
function mountElement(vnode: any, container:any) {
  const {type, props, children, shapeFlag} = vnode;
  const el = vnode.el = document.createElement(type);
  // const isOn = (key:string) => key.startsWith("on");
  // const isOn = (key:string) => /^on[A-Z]/.test(key)
  for (const key in props) {
    if(isOn(key)){
      el.addEventListener(key.slice(2).toLowerCase(),props[key]);
    }else {
      el.setAttribute(key, props[key]);
    }
  }
  shapeFlag & ShapeFlags.TEXT_CHILDREN && (el.innerHTML = children);
  shapeFlag & ShapeFlags.ARRAY_CHILDREN && mountChildren(vnode, el);
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