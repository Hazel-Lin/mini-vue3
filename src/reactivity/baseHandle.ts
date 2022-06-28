import { track, trigger } from "./effect";

// 优化 只需要创建一次
const get = createGetter()
const set = createSetter()
const getReadOnly = createGetter(true)

export const enum ReactiveFlags {
  IS_REACTIVE = "v_isReactive",
  IS_READONLY = "v_isReadonly",
}

// 创建get
export function createGetter(isReadonly = false){
  return function get (target,key){
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    }
    const res = Reflect.get(target,key);
    !isReadonly && track(target,key)
    return res;
  }
}
// 创建set
export function createSetter(isReadonly = false){
  return function set (target,key,value){
    const res = Reflect.set(target,key,value);
    !isReadonly && trigger(target,key)
    return res;
  }
}

// 创建Proxy
export function createProxy(raw,handle){
  return new Proxy(raw,handle)
}

export const reactiveHandler = {
  get,
  set,
}

export const readonlyHandler = {
  get:getReadOnly,
  set(target,key){
    console.warn(
      `key :"${String(key)}" set 失败，因为 target 是 readonly 类型`,
      target
    );
    return true
  }
}