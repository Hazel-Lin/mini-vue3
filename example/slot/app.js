import { h,createTextNode } from "../../lib/vue-thin.esm.js";
import { Foo } from "./foo.js";

export const App = {
  render(){
    const app = h("div", {}, "app");
    // 具名插槽
    const foo = h(Foo,{},{
      "header": ({age}) => [h('P',{},"header--" + age),createTextNode('你好，世界')],
      "footer": () => h('P',{},"footer")
    });

    return h(
     'div',
      {
      },
      [
        h("div",{},[app,foo]),
      ]
    )
  },
  setup(){
    return { }
  }
}