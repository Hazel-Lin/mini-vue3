import { readonly, isReadonly, isProxy } from '../reactive'
describe("readonly", () => {
  // readonly 没有set操作
  it("happy path", () => {
    const obj = { foo: 1 }
    // 返回了一个Proxy对象
    const wrapped = readonly(obj)
    expect(wrapped).not.toBe(obj)
    expect(wrapped.foo).toBe(1)
    expect(isReadonly(wrapped)).toBe(true);
    expect(isReadonly(obj)).toBe(false);
    expect(isProxy(wrapped)).toBe(true);
  })
  it("should call console.warn when set", () => {
    console.warn = jest.fn();
    const user = readonly({
      age: 10,
    });

    user.age = 11;
    expect(console.warn).toHaveBeenCalled();
  });
})