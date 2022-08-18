import { proxyRefs } from "..";
import { shallowReadonly } from "../reactivity/reactive";
import { isArray, isObject } from "../shared/index";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { emit } from "./componentEmit";
import { ShapeFlags } from "../shared/shapeFlags";

let currentInstance = null
export function createComponentInstance(vnode,parent) {
  const component = {
    vnode,
    type: vnode.type,
    emit: () => {},
    props: {},
    slots:{},
    provides: parent ? parent.provides : {},
    parent,
    isMounted: false,
    subTree: {},
    setupState:{}
  };
  component.emit = emit.bind(null, component) as any;
  return component;
}
// 在component对象上添加props属性
function initProps(instance,rawProps){
  instance.props = rawProps || {}
}
// 在component对象上添加slots属性 
function initSlots(instance,children){
  const { vnode } = instance;
  if (vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
    normalizeObjectSlots(children, instance.slots);
  }
}
function normalizeObjectSlots(children: any, slots: any) {
  for (const key in children) {
    const value = children[key];
    // value 是一个函数
    slots[key] = (params) => normalizeSlotValue(value(params));
  }
}

function normalizeSlotValue(value) {
  return isArray(value) ? value : [value];
}

export function setupComponent(instance) {
  initProps(instance,instance.vnode.props)
  initSlots(instance,instance.vnode.children)
  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance: any) {
  // 此时的instance上就有了props方法
  const Component = instance.type;
  // 创建一个代理对象 获取setupState中的值
  instance.proxy = new Proxy({ instance }, PublicInstanceProxyHandlers);

  const { setup } = Component;

  if (setup) {
    setCurrentInstance(instance);
    const setupResult = setup(shallowReadonly(instance.props),{
      emit: instance.emit,
    });
    setCurrentInstance(null);
    handleSetupResult(instance, setupResult);
  }
}

function handleSetupResult(instance, setupResult: any) {
  
  if (isObject(setupResult)) {
    // instance.setupState = setupResult;
    instance.setupState = proxyRefs(setupResult);
  }

  finishComponentSetup(instance);
}

function finishComponentSetup(instance: any) {
  const Component = instance.type;
  instance.render = Component.render;
}

export function getCurrentInstance() {
  return currentInstance;
}

function setCurrentInstance(instance) {
  currentInstance = instance;
}