import { isFunction } from "../shared/index";
import { getCurrentInstance } from "./component";

// 存储数据
export function provide(key, value) {
    let currentInstance:any = getCurrentInstance();
    if (!currentInstance) {
        return;
    }else{
      let { provides } = currentInstance;
      const parentProvides = currentInstance.parent.provides;
  
      if (provides === parentProvides) {
        provides = currentInstance.provides = Object.create(parentProvides);
      }
  
      provides[key] = value;
    }
}

// 获取数据
export function inject(key,defaultValue) {
    let currentInstance:any = getCurrentInstance();
    if (currentInstance) {
      const parentProvides = currentInstance.parent.provides;
  
      if (key in parentProvides) {
        return parentProvides[key];
      }else if(defaultValue){
        if(isFunction(defaultValue)){
          return defaultValue()
        }
        return defaultValue
      }
    }
}