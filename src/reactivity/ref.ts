import { hasChanged, isObject } from '../shared';
import {trackEffect, triggerEffect,isTracking} from './effect'
import { reactive } from './reactive';
class Ref{
  private _value:any;
  private _rawValue:any;
  public deps;
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