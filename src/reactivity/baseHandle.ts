import { extend, isObject } from "../shared";
import { track, trigger } from "./effect";
import { reactive, readonly } from "./reactive";

// 优化 只需要创建一次
const get = createGetter()
const set = createSetter()
const getReadOnly = createGetter(true)
const getShallowReadOnly = createGetter(true,true)

export const enum ReactiveFlags {
  IS_REACTIVE = "v_isReactive",
  IS_READONLY = "v_isReadonly",
}

// 创建get
export function createGetter(isReadonly = false, isShallowReadOnly = false){
  return function get (target,key){
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    }
    const res = Reflect.get(target,key);
    if(isShallowReadOnly){
      return res
    }
    // 判断嵌套中的对象是否是reactive对象
    if(isObject(res)) return isReadonly ? readonly(res) : reactive(res)
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
export function createReactiveObject(raw,handle){
  if (!isObject(raw)) {
    console.warn(`target ${raw} 必须是一个对象`);
    return raw
  }
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
// 响应式对象中嵌套的对象非响应式
export const shallowReadonlyHandler = extend({},readonlyHandler,{
  get:getShallowReadOnly,
})