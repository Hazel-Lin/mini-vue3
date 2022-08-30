import { NodeTypes } from "./ast";
import { helperMapName, TO_DISPLAY_STRING } from "./runtimeHelpers";
export const generate = (ast: any) => {
  // { children: [ { type: 3, content: 'hi' } ] } 
  // console.log(ast,'ast')
  // 生成string
  // let code = ''
  let result = genContext()
  const { push } = result

  let functionName = 'render'
  let p = ['_ctx','_cache']
  const signature = p.join(", ");

  let returnStr = "return "
  push(`return function ${functionName}(${signature}) {`)
  push(returnStr +  genNode(ast))
  push('}')
  genFunctionPreamble(ast, result);
  // code += `return function ${functionName}(`
  // code +=  p.join(', ') + ') {'
  // code += returnStr +  genNode(ast)
  // code += '}'
  return {
    code: result.code
  }
}
function genFunctionPreamble(ast, context) {
  const { push } = context;
  const VueBinging = "Vue";
  const aliasHelper = (s) => `${helperMapName[s]}:_${helperMapName[s]}`;
  if (ast.helpers.length > 0) {
    push(
      `const { ${ast.helpers.map(aliasHelper).join(", ")} } = ${VueBinging}`
    );
  }
  push("\n");
  push("return ");
}
function genNode(ast){
  let res = ast.codegenNode
  return `'${res.content}'`
}
function genContext (){
  const context = {
    code: '',
    push(source){
      context.code += source
    }
  }
  return context
}