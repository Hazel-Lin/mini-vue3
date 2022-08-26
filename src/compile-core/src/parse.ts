import { NodeTypes } from "./ast";

const start = "{{"
const end = "}}"
// ast 是一个对象 包含type和children属性
// children是一个数组 包含子节点
// children[0]是一个对象 包含type和content属性
export const baseParse = (content) =>{
  const context = createParserContext(content)
  return createRoot(parseChildren(context));
}
// 将内容放置在source中
function createParserContext(content) {
  return {
    source: content,
  };
}
// 解析children 如果一"{{"开始 则为插值 解析插值
// 重点在于如何解析插值
function parseChildren(context) {
  const nodes:any[] = []
  let node;
  // context = { source: '{{ message }}' }
  if(context.source.startsWith(start)){
    node = parseInterpolation(context)
  }
  nodes.push(node)
  // [ { type: 0, content: { type: 1, content: 'message' } } ]
  // console.log(nodes,'nodes');
  return nodes
}
// 解析插值 '{{ message }}'
function parseInterpolation(context) {
  // 2
  const sl = start.length
  const closeIndex = context.source.indexOf(
    end,
    sl
  );
  // 11 获取到结束括号 }} 开始的位置
  // console.log('closeIndex',closeIndex);
  // console.log('context',context);
  // 向前推进2位 ' message }}'
  advanceBy(context, sl);
  // 获取到插值的内容 message 的长度 可能存在空格
  const rawContentLength = closeIndex - sl;
  // console.log('context.source',context.source);
    //  context.source =  message }}
  const rawContent = context.source.slice(0, rawContentLength);
  const content = rawContent.trim()
  // 插值取值完成后 删除插值的内容
  advanceBy(context, rawContentLength + end.length);

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content,
    },
  };
}
function advanceBy(context: any, length: number) {
  console.log('context1',context);
  context.source = context.source.slice(length);
  console.log('context2',context);

}
function createRoot(children) {
  return {
    children,
  };
}