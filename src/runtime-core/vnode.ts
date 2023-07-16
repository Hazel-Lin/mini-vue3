import { isArray, isObject, isString } from '../shared/index'
import { ShapeFlags } from '../shared/shapeFlags'

export const Text = Symbol('Text')
export const Fragment = Symbol('Fragment')
export function createVNode(type, props?, children?) {
  const vnode = {
    type,
    props,
    children,
    key: props?.key,
    shapeFlag: getShapeFlag(type),
    component: null,
    el: null,
  }
  if (isString(children))
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN

  else if (isArray(children))
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN

  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    if (isObject(children))
      vnode.shapeFlag |= ShapeFlags.SLOT_CHILDREN
  }
  return vnode
}
export function createTextNode(text: string) {
  return createVNode(Text, {}, text)
}
export { createVNode as createElementVNode }
// 根据类型判断是元素还是组件
function getShapeFlag(type: any) {
  return isString(type) ? ShapeFlags.ELEMENT : ShapeFlags.STATEFUL_COMPONENT
}
