import { h } from "../../lib/vue-thin.esm.js";
export default {
  name: "Child",
  setup(props, { emit }) {},
  render(proxy) {
    console.log(this.$props.msg,'this')
    console.log(proxy,'this2')

    return h("div", {}, [h("div", {}, "child - props - msg: " + this.$props.msg)]);
  },
};
