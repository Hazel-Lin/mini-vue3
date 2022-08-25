import {
  h,
  ref,
  getCurrentInstance,
  nextTick,
} from "../../lib/vue-thin.esm.js";

export default {
  name: "App",
  setup() {
    const count = ref(1);
    const instance = getCurrentInstance();

    function onClick() {
      for (let i = 0; i < 100; i++) {
        console.log("update");
        count.value = i;
      }
      // 获取到未更新前的值
      console.log(instance,'instance');
      nextTick(() => {
      // 获取到更新后的值
        console.log(instance,'instance2');
      });

      // await nextTick()
      // console.log(instance)
    }

    return {
      onClick,
      count,
    };
  },
  render() {
    const button = h("button", { onClick: this.onClick }, "update");
    const p = h("p", {}, "count:" + this.count);

    return h("div", {}, [button, p]);
  },
};
