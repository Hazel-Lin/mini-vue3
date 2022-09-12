// mini-vue 出口
export * from "./runtime-dom";
import { baseCompile } from "./compile-core/src";
import * as runtimeDom from "./runtime-dom";
import { registerRuntimeCompiler } from "./runtime-dom";

function compileToFunction(template) {
  const { code } = baseCompile(template);
  const render = new Function("Vue", code)(runtimeDom);
  console.log(registerRuntimeCompiler,'registerRuntimeCompiler');
  return render;
}

registerRuntimeCompiler(compileToFunction);
