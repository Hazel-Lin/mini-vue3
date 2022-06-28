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
})