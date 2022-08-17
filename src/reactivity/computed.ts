import { ReactiveEffect } from "./effect";
class ComputedRefImpl{
  private _effect:any;
  private _dirty = true;
  private _value:any;
  constructor(getter){
    // 创建一个effect函数 handle为getter函数 scheduler为一个函数
    // scheduler第一次不会被调用 会直接执行getter函数
    this._effect = new ReactiveEffect(getter,() => {
      // 数据update后 执行trigger 判断是否有scheduler 有则执行scheduler中的方法 改变_dirty的值为true
      if(!this._dirty){
        this._dirty = true
      }
      console.log('执行scheduler中的方法');
    })
  }
  // 数据没有变化时 不会调用run方法 获取原有的值
  // 当用户读取数据时，即调用xxx.value时，会调用run方法，获取新的值
  get value(){
    if(this._dirty){
      this._dirty = false
      this._value = this._effect.run()
      console.log('this.value',this._value);
    }
    return this._value
  }
  
}
// getter为传入的fn
export function computed(getter){
  return new ComputedRefImpl(getter);
}