import { camelize, toHandlerKey } from "../shared/index";

// event 为用户传递的事件名称
export const emit = (instance: any, event: string, ...args: any[]) => {
  const { props } = instance;
  const handlerName = toHandlerKey(camelize(event));
  const handler = props[handlerName];
  handler && handler(...args);
}