import { hasChanged, isObject } from '../shared';
import { ReactiveFlags } from './baseHandle';
import {trackEffect, triggerEffect,isTracking} from './effect'
import { reactive } from './reactive';
class Ref{
  private _value:any;
  private _rawValue:any;
  public deps;
  public v_isRef = true
  constructor(value){
    // 判断value是否是一个对象 是对象则按reactive处理 否则不处理
    this._rawValue = value
    this._value = convert(value)
    this.deps = new Set()
  }
  get value(){
    if(isTracking()){
      // 收集依赖
      trackEffect(this.deps)
    }
    return this._value
  }
  set value(newValue){
    // 判断两者是否相等 相等则return
    if(!hasChanged(newValue, this._rawValue)) return
    this._rawValue = newValue
    this._value = convert(newValue)
    // 触发依赖
    triggerEffect(this.deps)
  }
}
// 判断是否是对象  如果将一个对象赋值给 ref，那么这个对象将通过 reactive() 转为具有深层次响应式的对象。
function convert(value){
  return isObject(value) ? reactive(value) : value
}
// ref 触发依赖收集
export function ref(raw){
  return new Ref(raw)
}
// 检查值是否为一个 ref 对象
export function isRef(ref){
  return !!ref.v_isRef
}
// 如果参数是一个 ref，则返回内部值，否则返回参数本身。
// 这是 val = isRef(val) ? val.value : val 的语法糖函数。
export function unRef(ref){
  return isRef(ref) ? ref.value : ref
}
// 返回ref的值
export function proxyRefs(objectWithRefs){
  return new Proxy(objectWithRefs,{
    get(target,key){
      return unRef(Reflect.get(target,key))
    },
    set(target,key,value){
      if (isRef(target[key]) && !isRef(value)) {
        return (target[key].value = value);
      } else {
        return Reflect.set(target, key, value);
      }
    }
  })
}