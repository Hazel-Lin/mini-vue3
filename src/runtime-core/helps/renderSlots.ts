import { createVNode } from "../vnode"
import { isFunction } from "../../shared/index"

export const renderSlots = (slots,name,params)=> {
  const slotName = slots[name];
  if(slotName){
    if(isFunction(slotName)){
      // 避免渲染多余的div节点
      return createVNode("Fragment", {}, slotName(params))
    }
  }
}