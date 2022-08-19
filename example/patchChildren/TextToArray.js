// 新的是 array
// 老的是 text
import { ref, h } from "../../lib/vue-thin.esm.js";

const prevChildren = "this is a oldChild";
const nextChildren = [h("div", {}, "A"), h("div", {}, "B"),h("div", {}, "=======")];

export default {
  name: "TextToArray",
  setup() {
    const isChange = ref(false);
    window.isChange = isChange;

    return {
      isChange,
    };
  },
  render() {
    const self = this;

    return self.isChange === true
      ? h("div", {}, nextChildren)
      : h("div", {}, prevChildren);
  },
};
