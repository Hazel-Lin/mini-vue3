import { h } from "../../lib/vue-thin.esm.js";

// render => h => createVNode => vnode
export const app = {
  render(){
    return h(
      // type: "div",
     'div',
     // props: {}
      {
        id: "root",
        class: ["red", "blue"],
      },
      // children: []
      [h("p", { class:"red"}, "hi"), h("p", {class:"blue"}, "vue-thin")]
    )
  },
  setup(){
    return { msg:'Vue-thin'}
  }
}