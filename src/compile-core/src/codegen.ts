import { isString } from "../../shared";
import { NodeTypes } from "./ast";
import { CREATE_ELEMENT_VNODE, helperMapName, TO_DISPLAY_STRING } from "./runtimeHelpers";

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
  const aliasHelps = (s) => `${helperMapName[s]}:_${helperMapName[s]}`
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
    case NodeTypes.ELEMENT:
      genElement(node, context);
      break;
    case NodeTypes.COMPOUND_EXPRESSION:
      genCompoundExpression(node, context);
  default:
    break;
}
  
}
function genElement(node: any, context: any) {
  const { push,helper } = context
  const { tag, props, children} = node
  console.log(props,'props')
  console.log(children,'children')
  push(`${helper(CREATE_ELEMENT_VNODE)}(`)
  genNodeList(genNullable([tag, props, children]), context);
  // genNode(children, context);
  // for (let i = 0; i < children.length; i++) {
  //   const child = children[i];
  //   genNode(child, context);
  // }
  push(`)`)
}
function genContext (){
  const context = {
    code: '',
    push(source){
      context.code += source
    },
    helper(key){
      return `_${helperMapName[key]}`
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

function genCompoundExpression(node: any, context: any) {
  const { children} = node
  const { push } = context

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if(isString(child)){
      push(child)
    }else{
      genNode(child, context);
    }
  }
}

function genNullable(arg: any[]) {
 return arg.map(item => item ? item : 'null')
}

function genNodeList(nodes, context) {
  const { push } = context;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (isString(node)) {
      push(node);
    } else {
      genNode(node, context);
    }

    if(i < nodes.length -1){
      push(", ")
    }
  }
}

