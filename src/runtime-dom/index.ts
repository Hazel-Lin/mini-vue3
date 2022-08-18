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
      console.log(el,key,newVal,123);
      el.setAttribute(key, newVal);
    }
  }
}

function insert(el, parent) {
  parent.append(el);
}

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
});

export function createApp(...args) {
  return renderer.createApp(...args);
}

export * from "../runtime-core";