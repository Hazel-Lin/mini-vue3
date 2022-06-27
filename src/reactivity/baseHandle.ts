import { track, trigger } from "./effect";

// 优化 只需要创建一次
const get = createGetter()
const set = createSetter()
const getReadOnly = createGetter(true)

// 创建get
export function createGetter(isReadOnly = false){
  return function get (target,key){
    const res = Reflect.get(target,key);
    !isReadOnly && track(target,key)
    return res;
  }
}
// 创建set
export function createSetter(isReadOnly = false){
  return function set (target,key,value){
    const res = Reflect.set(target,key,value);
    !isReadOnly && trigger(target,key)
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
  set(target,key,value){
    console.warn(
      `key :"${String(key)}" set 失败，因为 target 是 readonly 类型`,
      target
    );
    return true
  }
}