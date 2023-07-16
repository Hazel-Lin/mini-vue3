import { createRenderer } from '../runtime-core'

// 方法抽离
function createElement(type) {
  return document.createElement(type)
}

function patchProp(el, key, prevVal, newVal) {
  const isOn = (key: string) => /^on[A-Z]/.test(key)
  if (isOn(key)) {
    const event = key.slice(2).toLowerCase()
    el.addEventListener(event, newVal)
  }
  else {
    if (newVal === undefined || newVal === null)
      el.removeAttribute(key)

    else
      el.setAttribute(key, newVal)
  }
}
// 关于不传值没有出现报错的问题 有待理解
function insert(el, parent, anchor) {
  parent.insertBefore(el, anchor || null)
}
function remove(child) {
  const parent = child.parentNode
  if (parent)
    parent.removeChild(child)
}
function setElementText(el, text) {
  el.textContent = text
}
// 创建渲染器
const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
  remove,
  setElementText,
})
// 外部调用的createApp方法
export function createApp(...args) {
  return renderer.createApp(...args)
}

export * from '../runtime-core'
