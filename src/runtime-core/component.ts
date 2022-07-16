import { shallowReadonly } from "../reactivity/reactive";
import { isObject } from "../shared/index";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { emit } from "./componentEmit";
export function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type,
    emit: () => {},
    setupState:{}
  };
  component.emit = emit.bind(null, component) as any;
  return component;
}
// 在component对象上添加props属性
function initProps(instance,rawProps){
  instance.props = rawProps || {}
  console.log(instance.props, "instance.props");
}

export function setupComponent(instance) {
  initProps(instance,instance.vnode.props)
  // initSlots()
  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance: any) {
  // 此时的instance上就有了props方法
  const Component = instance.type;
  // 创建一个代理对象 获取setupState中的值
  instance.proxy = new Proxy({ instance }, PublicInstanceProxyHandlers);

  const { setup } = Component;

  if (setup) {
    const setupResult = setup(shallowReadonly(instance.props),{
      emit: instance.emit,
    });

    handleSetupResult(instance, setupResult);
  }
}

function handleSetupResult(instance, setupResult: any) {
  
  if (isObject(setupResult)) {
    instance.setupState = setupResult;
  }

  finishComponentSetup(instance);
}

function finishComponentSetup(instance: any) {
  const Component = instance.type;
  instance.render = Component.render;
}