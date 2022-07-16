import { h } from "../../lib/vue-thin.esm.js";
import { Foo } from "./foo.js";
// render => h => createVNode => vnode
window.self = null
export const App = {
  render(){
    window.self = this
    return h(
     'div',
      {
        id: "root",
        class: ["red", "blue"],
        onClick:() =>{ console.log('click') }
      },
      [
        h("div",{},"hi, " + this.msg),
        h(Foo, { 
          // add emit
          onAdd(a, b) {
            console.log("onAdd", a, b);
          },
          onAddFoo() {
            console.log("onAddFoo");
          }, }),
      ]
    )
  },
  setup(){
    return { msg:'Vue-thin'}
  }
}