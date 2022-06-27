import { reactive } from '../reactive'
import { effect } from '../effect'

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
    console.log('runner',runner);
    expect(foo).toBe(1);
    const res = runner();
    expect(res).toBe('foo');
  });

  // it("scheduler", () => {
  //   let dummy;
  //   let run: any;
  //   const scheduler = jest.fn(() => {
  //     run = runner;
  //   });
  //   const obj = reactive({ foo: 1 });
  //   const runner = effect(
  //     () => {
  //       dummy = obj.foo;
  //     },
  //     { scheduler }
  //   );
  //   expect(scheduler).not.toHaveBeenCalled();
  //   expect(dummy).toBe(1);
  //   // should be called on first trigger
  //   obj.foo++;
  //   expect(scheduler).toHaveBeenCalledTimes(1);
  //   // // should not run yet
  //   expect(dummy).toBe(1);
  //   // // manually run
  //   run();
  //   // // should have run
  //   expect(dummy).toBe(2);
  // });

  // it.skip("stop", () => {
  //   let dummy;
  //   const obj = reactive({ prop: 1 });
  //   const runner = effect(() => {
  //     dummy = obj.prop;
  //   });
  //   obj.prop = 2;
  //   expect(dummy).toBe(2);
  //   stop(runner);
  //   // obj.prop = 3;
  //   obj.prop++;
  //   expect(dummy).toBe(2);

  //   // stopped effect should still be manually callable
  //   runner();
  //   expect(dummy).toBe(3);
  // });

  // it.skip("onStop", () => {
  //   const obj = reactive({
  //     foo: 1,
  //   });
  //   const onStop = jest.fn();
  //   let dummy;
  //   const runner = effect(
  //     () => {
  //       dummy = obj.foo;
  //     },
  //     {
  //       onStop,
  //     }
  //   );

  //   stop(runner);
  //   expect(onStop).toBeCalledTimes(1);
  // });
})