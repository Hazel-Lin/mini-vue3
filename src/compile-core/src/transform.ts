// 1. 找到对应节点  深度优先

import { NodeTypes } from "./ast";
// 2. 修改节点内容
export const transform = (root, options={}) => {
  console.log('transform',root);
  const context:any = createTransformContext(root, options);
  console.log('context',context);
  traverseNode(root, context);
  createRootChildren(root);

  root.helpers =  [...context.helpers.keys()];
}
function createRootChildren(root: any) {
  const child = root.children[0];
  if(child.type === NodeTypes.ELEMENT){
    root.codegenNode = child.codegenNode;
  }else{
    root.codegenNode = root.children[0];
  }
}

function createTransformContext(root: any, options: any) {
  const context = {
    root,
    nodeTransforms: options.nodeTransforms || [],
    helpers:new Map(),
    helper(key){
      context.helpers.set(key,1)
    }
  };

  return context;
}
function traverseNode(node: any, context: any) {

  const nodeTransforms = context.nodeTransforms;
  const exitFns:any = []
  for (let i = 0; i < nodeTransforms.length; i++) {
    const transform = nodeTransforms[i];
    // 递归调用transform函数
    const onExit = transform(node,context);
    onExit && exitFns.push(onExit);
  }
  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      context.helper("toDisplayString");
      break;
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      traverseChildren(node, context);
      break;

    default:
      break;
  }
  let i = exitFns.length;
  while (i--) {
    exitFns[i]();
  }
}
function traverseChildren(node: any, context: any) {
  const children = node.children;

  if (children) {
    for (let i = 0; i < children.length; i++) {
      const node = children[i];
      traverseNode(node, context);
    }
  }
}

