const publicPropertiesMap = {
  $el:(i)=>i.vnode.el
}

export const PublicInstanceProxyHandlers = {
  // setupState则为setup方法 return的对象
  get: ({ instance }, key) => {
    const { setupState,props } = instance;
    if(key in setupState){
      return setupState[key];
    }
    // 将return的值 渲染到页面上
    if(key in props){
      return props[key];
    }
    // 当我们调用$el时 key为$el
    const publicGetter = publicPropertiesMap[key]
    if(publicGetter){
      return publicGetter(instance) 
    }
  },
}