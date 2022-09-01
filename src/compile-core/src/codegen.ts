import { NodeTypes } from "./ast";
import { helperMapName, TO_DISPLAY_STRING } from "./runtimeHelpers";
export const generate = (ast: any) => {
  // { children: [ { type: 3, content: 'hi' } ] } 
  console.log(ast,'ast')
  // 生成string
  // let code = ''
  //  抽取代码
  let result = genContext()
  const { push } = result
  // const helper = ["toDisplayString"]
  genFunctionPreamble(ast,result)
 
  let functionName = 'render'
  let p = ['_ctx','_cache']
  const signature = p.join(", ");

  let returnStr = "return "
  push(`return function ${functionName}(${signature}) {`)
  push(returnStr)
  genNode(ast.codegenNode,result)
  push('}')
  // code += `return function ${functionName}(`
  // code +=  p.join(', ') + ') {'
  // code += returnStr +  genNode(ast)
  // code += '}'
  return {
    code: result.code
  }
}
function genFunctionPreamble(ast,result){
  const { push } = result
  const aliasHelps = (s) => `${s}: _${s}`
  const _Vue = "Vue"
  if (ast.helpers.length > 0) {
    push(`const { ${ast.helpers.map(aliasHelps).join(', ')} } = ${_Vue}`)
  }
  push("\n")
}
function genNode(node,context){

switch (node.type) {
  case NodeTypes.TEXT:
    const { push } = context
    push(`'${node.content}'`)
    break;
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context);
      break;
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context);
      break;
  default:
    break;
}
  
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

function genInterpolation(node: any, context: any) {
  const { push } = context
  push(`_toDisplayString(`)
  genNode(node.content, context);
  push(`)`)
}
function genExpression(node: any, context: any) {
  const { push } = context
  push(`${node.content}`)
}

