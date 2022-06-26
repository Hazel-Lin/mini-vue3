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
import { track,trigger } from "./effect"
export function reactive(raw){
  return new Proxy(raw,{
    get(target,key){
      console.log(target,key,123)
      // 获取target[key]的值
      const res = Reflect.get(target,key);
      // 还需要收集依赖
      track(target,key)
      return res;
    },
    set(target,key,value){
      // 更新target[key]的值为value
      const res = Reflect.set(target,key,value);
      // 触发收集的依赖
      trigger(target,key)
      return res;
    }
  })
} 