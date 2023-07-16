const publicPropertiesMap = {
  $el: i => i.vnode.el,
  $slots: i => i.slots,
  // 新增$props 表示组件当前已解析的 props 对象。
  $props: i => i.props,
}

export const PublicInstanceProxyHandlers = {
  // setupState则为setup方法 return的对象
  get: ({ instance }, key) => {
    const { setupState, props } = instance
    if (key in setupState)
      return setupState[key]

    // 将return的值 渲染到页面上
    if (key in props)
      return props[key]

    // 当我们调用$el时 key为$el $slots key为$slots
    const publicGetter = publicPropertiesMap[key]
    if (publicGetter)
      return publicGetter(instance)
  },
}
