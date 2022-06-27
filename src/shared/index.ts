export const isObject = (val: unknown): val is Record<any, any> =>
  val !== null && typeof val === 'object'

 
export const extend = (effect,options) => Object.assign(effect,options)