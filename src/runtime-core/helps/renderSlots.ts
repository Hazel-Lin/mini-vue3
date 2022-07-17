import { createVNode } from "../vnode"
import { isFunction } from "../../shared/index"

export const renderSlots = (slots,name,params)=> {
  const slotName = slots[name];
  if(slotName){
    if(isFunction(slotName)){
    return createVNode("div", {}, slotName(params))
    }
  }
}