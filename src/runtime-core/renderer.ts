import { ShapeFlags } from "../shared/shapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { Fragment,Text } from "./vnode";
import { createAppAPI } from "./createApp";
import { effect } from "../reactivity/effect";

export function createRenderer(options){
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
  } = options;
  function render(vnode, container) {
    patch(null,vnode, container, null);
  }
  // n1 oldVnode n2 newVnode 
  // n1 存在则为更新 不存在则为初始化
  function patch(n1,n2: any, container: any,parentComponent) {
    const { type,shapeFlag } = n2 || {};
    switch (type) {
      case Fragment:
        processFragment(n1,n2, container,parentComponent);
        break;
      case Text:
        processText(n1,n2, container);
        break;
  
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1,n2, container,parentComponent);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1,n2, container,parentComponent);
        }
        break;
    }
  }
  function processText(n1,n2: any, container: any){
    const textNode = n2.el = document.createTextNode(n2.children);
    container.append(textNode);
  }
  function processFragment(n1,n2: any, container: any,processFragment) {
    mountChildren(n2, container,processFragment);
  }

  function processComponent(n1,n2: any, container: any,parentComponent) {
    mountComponent(n2, container,parentComponent);
  }

  function mountComponent(vnode: any, container,parentComponent) {
    const instance = createComponentInstance(vnode,parentComponent);
    setupComponent(instance);
    setupRenderEffect(instance, container,vnode);
  }
  function processElement(n1,n2: any, container: any,parentComponent) {
    if(!n1){
      mountElement(n2, container,parentComponent);
    }else{
      patchElement(n1,n2, container);
    }
  }
  function patchElement(n1,n2, container){
    console.log('props1',n1.props);
    console.log('props2',n2.props);
    // 值发生改变就需要更新
    const oldProps = n1.props;
    const newProps = n2.props;
    const el = (n2.el = n1.el);
    for(const key in newProps){
      const oldValue = oldProps[key];
      const newValue = newProps[key];
      if(oldValue !== newValue){
        hostPatchProp(el,key,oldValue,newValue);
      }
    }
  }
  function mountElement(vnode: any, container:any, parentComponent) {
    const {type, props, children, shapeFlag} = vnode;
    const el = (vnode.el = hostCreateElement(type));
    for (const key in props) {
      const val = props[key];
      hostPatchProp(el, key,null, val);
    }
    shapeFlag & ShapeFlags.TEXT_CHILDREN && (el.innerHTML = children);
    shapeFlag & ShapeFlags.ARRAY_CHILDREN && mountChildren(vnode, el,parentComponent);
    hostInsert(el, container);
  }
  function mountChildren(vnode, container,parentComponent) {
    vnode.children.forEach((v) => {
      patch(null,v, container,parentComponent);
    });
  }

  function setupRenderEffect(instance: any, container,vnode:any) {
    effect(()=>{
      if(!instance.isMounted){
        console.log('初始化')
        // 调用时绑定到代理对象上
        const { proxy } = instance;
        var subTree = instance.subTree = instance.render.call(proxy);
        patch(null,subTree, container,instance);
        // 根节点的el  赋值给组件的虚拟节点上
        vnode.el = subTree.el;
        console.log('subTree',subTree)
        instance.isMounted = true;
      }else{
        console.log('更新')
        const { proxy } = instance;
        var subTree = instance.render.call(proxy);
        // 获取旧值
        var prevSubTree = instance.subTree;
        console.log('prevSubTree',prevSubTree)
        console.log('subTree',subTree)
        // 更新旧值
        instance.subTree = subTree;
        patch(prevSubTree,subTree, container,instance);
      }
    })
  }
  return {
    createApp: createAppAPI(render),
  };
}