// 1. 找到对应节点  深度优先
// 2. 修改节点内容
export const transform = (root, options) => {
  console.log('transform',root);
  const context:any = createTransformContext(root, options);
  console.log('context',context);
  traverseNode(root, context);
}

function createTransformContext(root: any, options: any) {
  const context = {
    root,
    nodeTransforms: options.nodeTransforms || [],
  };

  return context;
}
function traverseNode(node: any, context: any) {
  console.log('node',node);

  const nodeTransforms = context.nodeTransforms;
  for (let i = 0; i < nodeTransforms.length; i++) {
    const transform = nodeTransforms[i];
    // 递归调用transform函数
    transform(node);
  }

  traverseChildren(node, context);
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

