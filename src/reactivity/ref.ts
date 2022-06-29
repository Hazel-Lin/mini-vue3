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
      trackEffect(this.deps)
    }
    return this._value
  }
  set value(newValue){
    if(!hasChanged(newValue, this._rawValue)) return
    this._rawValue = newValue
    this._value = convert(newValue)
    triggerEffect(this.deps)
  }
}
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