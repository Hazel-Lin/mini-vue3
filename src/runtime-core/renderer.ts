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
    insert:hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText
  } = options;
  function render(vnode, container) {
    patch(null,vnode, container, null, null);
  }
  // n1 oldVnode n2 newVnode 
  // n1 存在则为更新 不存在则为初始化
  function patch(n1,n2: any, container: any,parentComponent,anchor) {
    const { type,shapeFlag } = n2 || {};
    switch (type) {
      case Fragment:
        processFragment(n1,n2, container,parentComponent,anchor);
        break;
      case Text:
        processText(n1,n2, container);
        break;
  
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1,n2, container,parentComponent,anchor);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1,n2, container,parentComponent,anchor);
        }
        break;
    }
  }
  function processText(n1,n2: any, container: any){
    const textNode = n2.el = document.createTextNode(n2.children);
    container.append(textNode);
  }
  function processFragment(n1,n2: any, container: any,processFragment,anchor) {
    mountChildren(n2, container,processFragment,anchor);
  }

  function processComponent(n1,n2: any, container: any,parentComponent,anchor) {
    mountComponent(n2, container,parentComponent,anchor);
  }

  function mountComponent(vnode: any, container,parentComponent,anchor) {
    const instance = createComponentInstance(vnode,parentComponent);
    setupComponent(instance);
    setupRenderEffect(instance, container,vnode,anchor);
  }
  function processElement(n1,n2: any, container: any,parentComponent,anchor) {
    if(!n1){
      mountElement(n2, container,parentComponent,anchor);
    }else{
      patchElement(n1,n2, container,parentComponent,anchor);
    }
  }

  function patchElement(n1,n2, container,parentComponent,anchor){
    // 值发生改变就需要更新 window.isChange.value = true
    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;
    console.log("n1", n1);
    console.log("n2", n2);
    const el = (n2.el = n1.el);

    patchProps(el,oldProps,newProps);
    // 如果传递的值为container 则直接插入到container中 其他节点会受到影响
    // ”主页“ 这个节点是什么时候被渲染上去的？
    // patchChildren(n1,n2,container,parentComponent);
    patchChildren(n1,n2,el,parentComponent,anchor);

  }
  // 1. 老节点是数组 新节点是text 需要卸载老节点 并且设置text作为新节点
  // 2. 老节点是text 新节点是数组 需要直接移除老节点 并且mountChildren数组新节点
  function patchChildren(n1,n2,container,parentComponent,anchor){
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
      // 当新老节点都是数组时 需要用到我们常说的diff算法去对比
      if(newShapeFlag & ShapeFlags.ARRAY_CHILDREN){
        if(oldShapeFlag & ShapeFlags.TEXT_CHILDREN){
          // oldShapeFlag & ShapeFlags.TEXT_CHILDREN && n1.el.remove();
          // 应该为container 而不是n2.el
          oldShapeFlag & ShapeFlags.TEXT_CHILDREN && hostSetElementText(container,'');
          // 挂载数组节点
          mountChildren(nc,container,parentComponent,anchor);
        }else{
          if(oldShapeFlag & ShapeFlags.ARRAY_CHILDREN){
            patchKeyedChildren(oc,nc,container,parentComponent,anchor);
          }
        }
       
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
  // 新旧节点做diff算法 对比是否相等
  function patchKeyedChildren(
    c1,
    c2,
    container,
    parentComponent,
    parentAnchor
  ) {
    const l2 = c2.length;
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = l2 - 1;

    function isSomeVNodeType(n1, n2) {
      return n1.type === n2.type && n1.key === n2.key;
    }
    // 左侧
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];

      if (isSomeVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }

      i++;
    }
    // 右侧
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];

      if (isSomeVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }
      e1--;
      e2--;
    }

    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1;
        const anchor = nextPos < l2 ? c2[nextPos].el : null;

        while (i <= e2) {
          patch(null, c2[i], container, parentComponent, anchor);
          i++;
        }
      } 
    } else if (i > e2) {
        while (i <= e1) {
            hostRemove(c1[i].el);
            i++;
        }
    }else{
      // 中间部分对比
      let s1 = i;
      let s2 = i;

      const toBePatched = e2 - s2 + 1;
      let patched = 0;
      const keyToNewIndexMap = new Map();
      const newIndexToOldIndexMap = new Array(toBePatched);
      let moved = false;
      let maxNewIndexSoFar = 0;

      for (let i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0;

      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i];
        keyToNewIndexMap.set(nextChild.key, i);
      }

      for (let i = s1; i <= e1; i++) {
        const prevChild = c1[i];

        if (patched >= toBePatched) {
          hostRemove(prevChild.el);
          continue;
        }

        let newIndex;
        if (prevChild.key != null) {
          newIndex = keyToNewIndexMap.get(prevChild.key);
        } else {
          for (let j = s2; j < e2; j++) {
            if (isSomeVNodeType(prevChild, c2[j])) {
              newIndex = j;

              break;
            }
          }
        }

        if (newIndex === undefined) {
          hostRemove(prevChild.el);
        } else {
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex;
          } else {
            moved = true;
          }
          newIndexToOldIndexMap[newIndex - s2] = i + 1;
          patch(prevChild, c2[newIndex], container, parentComponent, null);
          patched++;
        }
      }
      const increasingNewIndexSequence = moved
      ? getSequence(newIndexToOldIndexMap)
      : [];
      let j = increasingNewIndexSequence.length - 1;

      for (let i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = i + s2;
        const nextChild = c2[nextIndex];
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;

        if (newIndexToOldIndexMap[i] === 0) {
          patch(null, nextChild, container, parentComponent, anchor);
        } else if (moved) {
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            hostInsert(nextChild.el, container, anchor);
          } else {
            j--;
          }
        }
      }
    }
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
  function mountElement(vnode: any, container:any, parentComponent,anchor:any) {
    const {type, props, children, shapeFlag} = vnode;
    const el = (vnode.el = hostCreateElement(type));
    for (const key in props) {
      const val = props[key];
      hostPatchProp(el, key,null, val);
    }
    shapeFlag & ShapeFlags.TEXT_CHILDREN && (el.innerHTML = children);
    shapeFlag & ShapeFlags.ARRAY_CHILDREN && mountChildren(vnode.children, el,parentComponent,anchor);
    // 添加anchor 挂载到具体位置
    hostInsert(el, container, anchor);
  }
  function mountChildren(children, container,parentComponent,anchor) {
    children.forEach((v) => {
      patch(null,v, container,parentComponent,anchor);
    });
  }

  function setupRenderEffect(instance: any, container,vnode:any,anchor) {
    effect(()=>{
      if(!instance.isMounted){
        console.log('初始化')
        // 调用时绑定到代理对象上
        const { proxy } = instance;
        var subTree = instance.subTree = instance.render.call(proxy);
        patch(null,subTree, container,instance,anchor);
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
        patch(prevSubTree,subTree, container,instance,anchor);
      }
    })
  }
  return {
    createApp: createAppAPI(render),
  };
}
function getSequence(arr) {
  const p = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = (u + v) >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}