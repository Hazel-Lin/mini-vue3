import { h } from "../../lib/vue-thin.esm.js";
import { Foo } from "./foo.js";

export const App = {
  render(){
    const app = h("div", {}, "app");
    // 具名插槽
    const foo = h(Foo,{},{
      "header": ({age}) => h('P',{},"THIS IS A SLOT1---" + age),
      "footer": () => h('P',{},"THIS IS A SLOT2")
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