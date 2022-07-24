import { h,getCurrentInstance } from "../../lib/vue-thin.esm.js";
export const Foo = {
  setup() {
    const instance = getCurrentInstance()
    console.log('foo',instance)
    return {}
  },
  render() {
    const age = 20
    return h("div", {}, "age: " + age);
  },
};
