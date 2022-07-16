import { h } from "../../lib/vue-thin.esm.js";

export const Foo = {
  setup(props, { emit }) {
    console.log(props);
    const emitAdd = () => {
      console.log("emit add");
      emit("add",1,2);
      emit("add-foo");
    };
    return{
      emitAdd
    }

  },
  // 渲染到页面
  render() {
    const btn = h(
      "button",
      {
        onClick: this.emitAdd,
      },
      "emitAdd"
    );
    const foo = h("p", {}, "foo");
    return h("div", {}, [foo, btn]);
  },
};
