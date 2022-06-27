import { readonly } from '../reactive'
describe("readonly", () => {
  // readonly 没有set操作
  it("happy path", () => {
    const obj = {foo:1}
    const wrapped = readonly(obj)
    expect(wrapped).not.toBe(obj)
    expect(wrapped.foo).toBe(1)
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