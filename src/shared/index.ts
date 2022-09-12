export * from "./toDisplayString";
export const isObject = (val: unknown): val is Record<any, any> =>
  val !== null && typeof val === 'object'
export const isFunction = (val: unknown): val is Function =>
  typeof val === 'function'
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

export const camelize = (str: string) => {
  return str.replace(/-(\w)/g, (_, c: string) => {
    return c ? c.toUpperCase() : "";
  });
};

const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const toHandlerKey = (str: string) => {
  return str ? "on" + capitalize(str) : "";
};
export const isEqual = (oldVal:any,newVal:any) => {
  return oldVal === newVal
};
export const EMPTY_OBJ = {}

export function isSameVNodeType(n1: any, n2: any): boolean {
  // 比较type和key是否相等
  return n1.type === n2.type && n1.key === n2.key
}
