import { NodeTypes } from "../ast";
import { CREATE_ELEMENT_VNODE } from "../runtimeHelpers";

export const transformElement = function(node,context){
    if(node.type === NodeTypes.ELEMENT){
      return () => {
        context.helper(CREATE_ELEMENT_VNODE)
        const { props,tag,children } = node;
        const vnodeTag = `"${tag}"`;
        const vnodeProps = props;
        let vnodeChildren = children[0];
        const vnodeElement = {
          type: NodeTypes.ELEMENT,
          tag:vnodeTag,
          props:vnodeProps,
          children:vnodeChildren
        }
        node.codegenNode = vnodeElement
      }
     
  }
}