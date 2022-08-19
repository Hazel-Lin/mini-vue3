import { h } from "../../lib/vue-thin.esm.js";

import ArrayToText from "./ArrayToText.js";
import TextToText from "./TextToText.js";
import TextToArray from "./TextToArray.js";
import ArrayToArray from "./ArrayToArray.js";

export default {
  name: "App",
  setup() {},

  render() {
    return h("div", { tId: 1 }, [
      h("p", {}, "主页"),
      // 节点可能为text 或者是 array 故分为一下几种情况
      // oldVnode = array newVnode = text
      // h(ArrayToText),
      // oldVnode text newVnode text
      // h(TextToText),
      // oldVnode text newVnode array
      // h(TextToArray)
      // oldVnode array newVnode array
      h(ArrayToArray),
    ]);
  },
};
