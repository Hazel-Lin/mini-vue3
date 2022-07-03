// createApp 放入一个根组件
import { render } from "./renderer";
import { createVNode } from "./vnode";
export function createApp(rootComponent){
 console.log(rootComponent,'rootComponent')
  return { 
    mount(rootContainer){
      // 组件转换为虚拟节点
      const VNode = createVNode(rootComponent)

      render(VNode, rootContainer);
    }
  }
}


