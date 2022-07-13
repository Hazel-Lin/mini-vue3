import { h } from "../../lib/vue-thin.esm.js";
import { Foo } from "./foo.js";
// render => h => createVNode => vnode
window.self = null
export const App = {
  render(){
    window.self = this
    return h(
      // type: "div",
     'div',
     // props: {}
      {
        id: "root",
        class: ["red", "blue"],
        onClick:() =>{ console.log('click') }
      },
      [
        h("div",{},"hi, " + this.msg),
        h(Foo, { count: 1 }),
      ]
      // this.$el 为获取到的根元素 此时为root
      // this.$el,
      // "hi, " + this.msg
      // children: []
      // [h("p", { class:"red"}, "hi"), h("p", {class:"blue"}, this.msg)]
    )
  },
  setup(){
    return { msg:'Vue-thin'}
  }
}