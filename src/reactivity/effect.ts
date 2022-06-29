import { extend } from "../shared";

let activeEffect;
let shouldTrack = true
const targetMap = new Map()
class reactiveEffect{
  private _handle :any = null;
  public scheduler:Function | undefined
  public depList = []
  private flag = true;
  public onStop?: () => void
  constructor(handle,scheduler?:Function){
    this._handle = handle;
    this.scheduler = scheduler
  }
  run(){
    activeEffect = this
    shouldTrack = true
    return this._handle()
  }
  // 调用stop方法后 删除掉对应的effect
  stop(){
    if(this.flag){
      cleanupEffect(this)
      this.onStop && this.onStop()
      this.flag = false
    }
  }
}
function cleanupEffect(effect){
  effect.depList.forEach((el:any) =>{
    el.delete(effect);
  })
  // 把 effect.deps 清空
  effect.depList.length = 0
}


// 副作用函数
// 如何在更新的时候只执行scheduler
export function effect(handle,options:any = {}) {
  const _effect = new reactiveEffect(handle,options.scheduler)
  extend(_effect,options)
  _effect.run()
  // 返回run 方法
  const runner:any = _effect.run.bind(_effect)
  runner.effect = _effect
  return runner
}

/** 
 * 依赖收集
 * target目标对象 key和value分别为目标对象中的键和值
 * target { age:10 } key = age
 * 名称不能重复
 * 获取到target对象中的每一个key对应的值
 * targetMap 所有响应式对象
 * depsMap 具体某一个响应式对象的key的依赖
 * dep 具体某一个key的依赖
 * 初始化的时候
 * targetMap Map(0) {{ age:10 } => depsMap Map(0)}
 * depsMap Map(0) {age => dep Set(0)}
 *
*/
export function track(target,key){
    if (!isTracking()) return;

    let depsMap = targetMap.get(target)
    if(!depsMap){
      depsMap = new Map()
      targetMap.set(target,depsMap)
    }
    let dep = depsMap.get(key)
    if(!dep){
      dep = new Set()
      depsMap.set(key,dep)
    }
    trackEffect(dep)
}
export function trackEffect(dep){
  if(dep.has(activeEffect)) return
    // 收集依赖
    dep.add(activeEffect)
    // 反向收集对应的dep
    activeEffect.depList.push(dep)
}
// 判断是否在收集
export function isTracking(){
  return shouldTrack && activeEffect !== undefined;
}
// 触发依赖
// age更新了 
export function trigger(target,key){
  let depsMap = targetMap.get(target)
  let dep = depsMap.get(key)
  triggerEffect(dep)
}
export function triggerEffect(dep){
  for(const effect of dep){
    // 通过public获取到scheduler
    if(effect.scheduler){
      effect.scheduler()
    }else{
      effect.run()
    }
  }
}
// reactive判断有没有调用stop函数
export function stop(runner){
  runner.effect.stop()
  shouldTrack = false
}