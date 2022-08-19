import { ShapeFlags } from "../shared/shapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { Fragment,Text } from "./vnode";
import { createAppAPI } from "./createApp";
import { effect } from "../reactivity/effect";
import { EMPTY_OBJ, isEqual } from "../shared";

export function createRenderer(options){
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText
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
      patchElement(n1,n2, container,parentComponent);
    }
  }

  function patchElement(n1,n2, container,parentComponent){
    // 值发生改变就需要更新 window.isChange.value = true
    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;
    const el = (n2.el = n1.el);

    patchProps(el,oldProps,newProps);
    // 如果传递的值为container 则直接插入到container中 其他节点会受到影响
    // ”主页“ 这个节点是什么时候被渲染上去的？
    // patchChildren(n1,n2,container,parentComponent);
    patchChildren(n1,n2,el,parentComponent);

  }
  // 1. 老节点是数组 新节点是text 需要卸载老节点 并且设置text作为新节点
  // 2. 老节点是text 新节点是数组 需要直接移除老节点 并且mountChildren数组新节点
  function patchChildren(n1,n2,container,parentComponent){
    const { children: oc, shapeFlag: oldShapeFlag } = n1
    const { children: nc, shapeFlag: newShapeFlag } = n2
    
    if(!isEqual(oc,nc)){
      // 老节点是数组 新节点是text 
      if(newShapeFlag & ShapeFlags.TEXT_CHILDREN){
        oldShapeFlag & ShapeFlags.ARRAY_CHILDREN && unmountChildren(oc);
        // (n2.el.innerHTML = nc);
        // 应该为container 而不是n2.el
        // hostSetElementText(n2.el,nc);
        hostSetElementText(container,nc);

      }
      // 老节点是text 新节点是数组
      if(newShapeFlag & ShapeFlags.ARRAY_CHILDREN){
        // oldShapeFlag & ShapeFlags.TEXT_CHILDREN && n1.el.remove();
        // 应该为container 而不是n2.el
        oldShapeFlag & ShapeFlags.TEXT_CHILDREN && hostSetElementText(container,'');
        // 挂载数组节点
        mountChildren(nc,container,parentComponent);
      }
    }
  }
  // 当节点为数组的时候 更新节点才需要先去卸载节点
  function unmountChildren(children){
    children.forEach(child => {
      hostRemove(child.el);
      // 以下也为卸载节点的方式
      // if(child.shapeFlag & ShapeFlags.ELEMENT){
      //   child.el.remove();
      // }
    })
  }

  function patchProps(el, oldProps, newProps) {
    if(!isEqual(oldProps,newProps)){
      for(const key in newProps){
        const oldValue = oldProps[key];
        const newValue = newProps[key];
        if(oldValue !== newValue){
          hostPatchProp(el,key,oldValue,newValue);
        }
      }
      if(oldProps !== EMPTY_OBJ){
        for(const key in oldProps){
          if(!(key in newProps)){
            hostPatchProp(el,key,oldProps[key],null);
          }
        }
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
    shapeFlag & ShapeFlags.ARRAY_CHILDREN && mountChildren(vnode.children, el,parentComponent);
    hostInsert(el, container);
  }
  function mountChildren(children, container,parentComponent) {
    children.forEach((v) => {
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
        instance.isMounted = true;
      }else{
        console.log('更新')
        const { proxy } = instance;
        var subTree = instance.render.call(proxy);
        // 获取旧值
        var prevSubTree = instance.subTree;
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