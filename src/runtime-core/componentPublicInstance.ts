const publicPropertiesMap = {
  $el:(i)=>i.vnode.el
}

export const PublicInstanceProxyHandlers = {
 
  get: ({ instance }, key) => {
    const { setupState } = instance;
    if(key in setupState){
      return setupState[key];
    }
    // 当我们调用$el时 key为$el
    const publicGetter = publicPropertiesMap[key]
    if(publicGetter){
      return publicGetter(instance) 
    }
  },
}