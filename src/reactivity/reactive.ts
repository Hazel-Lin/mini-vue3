/** 
 * 创建一个响应式数据
 * 数据劫持 proxy 
 * get 方法获取到对象属性
 * set 方法更新对象属性
 * 对数据做一个依赖收集
*/
/** 
 * raw { age:10 } => 一个Proxy代理后的对象 ∴ return new Proxy
 * 此时raw { age:10 } 是Proxy需要代理的目标对象
 * get方法 读取的时候触发 
 * target目标对象 key目标对象中的键
 * set方法 更新修改的时候触发 
 * target目标对象 key和value分别为目标对象中的键和值
 *
*/
import { 
  createReactiveObject,
  reactiveHandler,
  readonlyHandler,
  shallowReadonlyHandler,
  ReactiveFlags
} from "./baseHandle"

// raw为目标对象 需要代理的对象
export function reactive(raw){
  return createReactiveObject(raw,reactiveHandler)
}
export function readonly(raw){
  return createReactiveObject(raw,readonlyHandler)
}
// 判断是否是响应式对象
export function isReactive(Object){
  return !!Object[ReactiveFlags.IS_REACTIVE]
}
export function isReadonly(Object){
  return !!Object[ReactiveFlags.IS_READONLY]
}
// 判断是否是shallowReadonly对象 shallowReadonly内部嵌套的不是响应式对象
export function shallowReadonly(raw){
  return createReactiveObject(raw,shallowReadonlyHandler)
}
// 检查对象是否是由 reactive 或 readonly 创建的 proxy。
export function isProxy(raw){
  return isReactive(raw) || isReadonly(raw)
}
