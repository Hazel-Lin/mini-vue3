import {reactive,isReactive} from "../reactive"

describe('reactive', () => {
  it('happy path', () => {
  let originObj = {foo:1}
  let observe = reactive(originObj)
  expect(observe).not.toBe(originObj)
  expect(observe.foo).toBe(1)
  expect(isReactive(observe)).toBe(true);
  expect(isReactive(originObj)).toBe(false);
  })
  test("nested reactives", () => {
    const original = {
      nested: {
        foo: 1,
      },
      array: [{ bar: 2 }],
    };
    const obj = { friends: { name: 'lilei', age: 20 } }
    const observed = reactive(original);
    expect(isReactive(observed.nested)).toBe(true);
    expect(isReactive(observed.array)).toBe(true);
    expect(isReactive(observed.array[0])).toBe(true);
    expect(isReactive(obj.friends)).toBe(false);
  });
})