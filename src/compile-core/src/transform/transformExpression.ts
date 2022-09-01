import { NodeTypes } from "../ast";

// 处理节点
export function transformExpression(node) {
  if (node.type === NodeTypes.INTERPOLATION) {
    node.content = processExpression(node.content);
  }
}

function processExpression(node: any) {
  node.content = `_ctx.${node.content}`;
  return node;
}