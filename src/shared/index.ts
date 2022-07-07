export const isObject = (val: unknown): val is Record<any, any> =>
  val !== null && typeof val === 'object'

export const isString = (value) => typeof value === "string";
export const isArray = Array.isArray
export const extend = Object.assign
// 判断是否需要改变
export const hasChanged = (newValue,oldValue)=> { 
  return !Object.is(newValue,oldValue)
}
export const hasOwn = (val, key) =>
  Object.prototype.hasOwnProperty.call(val, key);

const onRE = /^on[^a-z]/
export const isOn = (key: string) => onRE.test(key)