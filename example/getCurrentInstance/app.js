import { h,getCurrentInstance } from "../../lib/vue-thin.esm.js";
import { Foo } from "./foo.js";

export const App = {
  render(){
    return h("div", {}, [h("p", {}, "foo"), h(Foo)]);
  },
  setup(){
    const instance = getCurrentInstance()
    console.log('app',instance)
  }
}