import { h,renderSlots } from "../../lib/vue-thin.esm.js";
export const Foo = {
  setup() {},
  render() {
    // slot
    const foo = h('p',{},"foo")
    // children 为虚拟节点VNode

    // 实现具名插槽
    // 添加到指定元素的指定位置
    // 作用域插槽 传递参数age
    const age = 20
    return h("div", {}, [
      renderSlots(this.$slots,'header',{age}),
      foo,
      renderSlots(this.$slots,'footer'),
    ]);
  },
};
