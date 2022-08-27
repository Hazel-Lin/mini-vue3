import { NodeTypes } from "./ast";

const start = "{{"
const end = "}}"
const enum TagType {
  Start,
  End,
}
// ast 是一个对象 包含type和children属性
// children是一个数组 包含子节点
// children[0]是一个对象 包含type和content属性
export const baseParse = (content) =>{
  const context = createParserContext(content)
  return createRoot(parseChildren(context,[]));
}
// 将内容放置在source中
function createParserContext(content) {
  return {
    source: content,
  };
}
// 解析children 如果一"{{"开始 则为插值 解析插值
// 重点在于如何解析插值
// <div><p>hi</p>{{message}}</div> 解析元素  解析元素 解析文本 解析插值
// <div>hi,{{message}}</div>
// 1. 循环判断属于哪个类型
function parseChildren(context,parseEndTag) {
  const nodes:any[] = []
  // console.log('isEnd(context)',isEnd(context));
  while(!isEnd(context,parseEndTag)){
    let node;
    // context = { source: '{{ message }}' }
    if(context.source.startsWith(start)){
      node = parseInterpolation(context)
    }else if(context.source.startsWith('<')){
      // 如果第一位是< 则解析element 再判断是否是字母
      // console.log(context,'context1');
      // { source: '<div></div>' } context
      if (/[a-z]/i.test(context.source[1])) {
        node = parseElement(context);
      }
      // { type: 2, tag: 'div' }
    }
    // console.log(node,'node');

    // 解析文本
    if (!node) {
      node = parseText(context);
    }
    
    nodes.push(node)
    // [ { type: 0, content: { type: 1, content: 'message' } } ]
    // console.log(nodes,'nodes');
  }
  return nodes
}
  // 解析文本
function parseText(context){
  // console.log('context',context.source,context.source.length);
  // 获取到数据 删除空格
  // 删除获取后的代码
  // 直接返回文本节点内容
  // const content = context.source
  let endTokens = ['<','{{']
  // let endTokens = '{{'


  let endIndex = context.source.length
  // 当同时遇到{{或<时 比较两者的index值 取最小的
  console.log(context.source,'context.source');

  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i]);
  console.log(index,'index');

    if (index !== -1 && endIndex > index) {
      endIndex = index
    }
  }
  console.log(endIndex,'endIndex');

  // if(context.source.indexOf(endTokens) > -1){
  //   endIndex = context.source.indexOf(endTokens)
  // }
  const content = parseTextData(context, endIndex);
  console.log('content---------',content);

  return {
    type: NodeTypes.TEXT,
    content,
  };
}
function parseElement(context){
  // 处理开始标签 返回tag节点
  const element:any = parseTag(context, TagType.Start)
  // 递归调用parseChildren
  element.children = parseChildren(context,element.tag)
  // console.log(element,'element');

  // 处理结束标签
  parseTag(context,TagType.End)
  return element;
}
// 设置一个全局变量
// let parseEndTag:any = null;
// 此时context应该是 <div></div>
function parseTag(context,type:TagType){
  // console.log('context2',context);
  // <div>hi,{{message}}</div>
  // console.log(context.source,'11111111');

  const match:any = /^<\/?([a-z]*)/i.exec(context.source)
  // console.log('match-----',match);
  // parseEndTag = match[1]
  const tag = match[1]
  // 删除处理完成的标签
  advanceBy(context, match[0].length);
  advanceBy(context, 1);
  // console.log('context.source',context.source);
  // 处理结束标签时 不需要返回节点
  if (type === TagType.End) return;
  return {
    type: NodeTypes.ELEMENT,
    tag,
  };
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
  context.source = context.source.slice(length);
}
function createRoot(children) {
  return {
    children,
  };
}

function isEnd(context: any,parseEndTag) {
  // 1. 当source为空时 返回true
  // 2. 当遇到结束标签时 返回true
  if(context.source.startsWith(`</${parseEndTag}>`)){
    return true;
  }
 return !context.source
}
function parseTextData(context: any, length: any) {
  const content = context.source.slice(0, length);
  // 2. 推进
  advanceBy(context, length);
  return content;
}