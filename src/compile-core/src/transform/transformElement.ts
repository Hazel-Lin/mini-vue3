import { NodeTypes,createVNodeCall } from "../ast";

export const transformElement = function(node,context){
    if(node.type === NodeTypes.ELEMENT){
      return () => {
        const { props,tag,children } = node;
        const vnodeTag = `"${tag}"`;
        const vnodeProps = props;
        let vnodeChildren = children[0];
        node.codegenNode = createVNodeCall(context,vnodeTag,vnodeProps,vnodeChildren)
      }
     
  }
}