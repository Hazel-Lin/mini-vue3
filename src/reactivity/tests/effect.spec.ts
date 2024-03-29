import { reactive } from '../reactive'
import { effect,stop } from '../effect'

describe('effect', () => { 
  it('happy path', () => {
    let user = reactive({
      age:10
    })
    let updateAge;
    effect(()=>{
      updateAge = user.age + 1
    });

    expect(updateAge).toBe(11)
    
    // 响应式数据更新后
    user.age++
    expect(updateAge).toBe(12)

  })

  it("should return runner when call effect", () => {
    // effect.run首先会执行一次
    // 当调用 runner 的时候可以重新执行 effect.run
    // runner 的返回值就是用户给的 fn 的返回值
    // 调用runner就会执行 effect.run
    let foo = 0;
    const runner = effect(() => {
      foo++;
      return 'foo';
    });
    expect(foo).toBe(1);
    const res = runner();
    expect(res).toBe('foo');
  });

  it("scheduler", () => {
    // effect中会传入一个scheduler
    // scheduler 第一次不会执行 只会执行effect.run
    // 值发生改变时 才会去执行scheduler 并且不会执行effect.run
    // 只有当run执行时 才会执行effect.run
    let dummy;
    let run: any;
    // 把effect.run 返回的结果赋值给run
    const scheduler = jest.fn(() => {
      run = runner;
    });
    const obj = reactive({ foo: 1 });
    // effect中传入两个参数 一个函数和一个scheduler为key的对象
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      { scheduler }
    );
    expect(scheduler).not.toHaveBeenCalled();
    expect(dummy).toBe(1);
    obj.foo++;
    expect(scheduler).toHaveBeenCalledTimes(1);
    // // should not run yet
    expect(dummy).toBe(1);
    // // manually run
    run();
    // // should have run
    expect(dummy).toBe(2);
  });

  it("stop", () => {
    // effect函数还是会自执行一次
    // 当执行了stop函数后 数据更新后也不会执行effect
    // 手动调用runner后才会执行
    let dummy;
    const obj = reactive({ prop: 1 });
    const runner = effect(() => {
      dummy = obj.prop;
    });
    obj.prop = 2;
    expect(dummy).toBe(2);
    stop(runner);
    // obj.prop = 3;
    // obj.prop = obj.prop + 1
    obj.prop++
    expect(dummy).toBe(2);

    // stopped effect should still be manually callable
    runner();
    expect(dummy).toBe(3);
  });

  it("onStop", () => {
    // onStop函数的调用
    const obj = reactive({
      foo: 1,
    });
    const onStop = jest.fn();
    let dummy;
    // effect中传入两个参数 一个函数和一个onStop为key的对象
    // 调用stop函数之后 onStop会被调用 会获取到obj.foo中的值
    // onStop是一个函数
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      {
        onStop,
      }
    );

    stop(runner);
    expect(onStop).toBeCalledTimes(1);
  });
})