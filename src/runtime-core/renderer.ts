
import { isOn } from "../shared/index";
import { ShapeFlags } from "../shared/shapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { Fragment,Text } from "./vnode";

export function render(vnode, container) {
  patch(vnode, container, null);
}

function patch(vnode: any, container: any,parentComponent) {
  const { type,shapeFlag } = vnode || {};
  switch (type) {
    case Fragment:
      processFragment(vnode, container,parentComponent);
      break;
    case Text:
      processText(vnode, container);
      break;

    default:
      if (shapeFlag & ShapeFlags.ELEMENT) {
        processElement(vnode, container,parentComponent);
      } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        processComponent(vnode, container,parentComponent);
      }
      break;
  }
}
function processText(vnode: any, container: any){
  const el = vnode.el = document.createTextNode(vnode.children);
  container.append(el);
}
function processFragment(vnode: any, container: any,processFragment) {
  mountChildren(vnode, container,processFragment);
}

function processComponent(vnode: any, container: any,parentComponent) {
  mountComponent(vnode, container,parentComponent);
}

function mountComponent(vnode: any, container,parentComponent) {
  const instance = createComponentInstance(vnode,parentComponent);
  setupComponent(instance);
  setupRenderEffect(instance, container,vnode);
}
function processElement(vnode: any, container: any,parentComponent) {
  mountElement(vnode, container,parentComponent);
}
function mountElement(vnode: any, container:any, parentComponent) {
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
  shapeFlag & ShapeFlags.ARRAY_CHILDREN && mountChildren(vnode, el,parentComponent);
  container.append(el);
}
function mountChildren(vnode, container,parentComponent) {
  vnode.children.forEach((v) => {
    patch(v, container,parentComponent);
  });
}

function setupRenderEffect(instance: any, container,vnode:any) {
  // 调用时绑定到代理对象上
  const { proxy } = instance;
  var subTree = instance.render.call(proxy);
  patch(subTree, container,instance);
  // 根节点的el  赋值给组件的虚拟节点上
  vnode.el = subTree.el;
}