import { createRenderer } from "../runtime-core";

// 方法抽离
function createElement(type) {
  return document.createElement(type);
}

function patchProp(el, key, prevVal, newVal) {
  const isOn = (key: string) => /^on[A-Z]/.test(key);
  if (isOn(key)) {
    const event = key.slice(2).toLowerCase();
    el.addEventListener(event, newVal);
  } else {
    if(newVal === undefined || newVal === null){
      el.removeAttribute(key);
    }else{
      el.setAttribute(key, newVal);
    }
  }
}

function insert(el, parent,achor) {
  parent.append(el);
  parent.insertBefore(el, achor);
}
function remove(child) {
  const parent = child.parentNode;
  if (parent) {
    parent.removeChild(child);
  }
}
function setElementText(el, text) {
  el.textContent = text;
}

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
  remove,
  setElementText
});

export function createApp(...args) {
  return renderer.createApp(...args);
}

export * from "../runtime-core";