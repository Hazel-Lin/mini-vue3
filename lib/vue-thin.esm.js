const isObject = (val) => val !== null && typeof val === 'object';
const isString = (value) => typeof value === "string";
const isArray = Array.isArray;
const extend = Object.assign;
const onRE = /^on[^a-z]/;
const isOn = (key) => onRE.test(key);

const targetMap = new Map();
// 触发依赖
// age更新了 
function trigger(target, key) {
    let depsMap = targetMap.get(target);
    let dep = depsMap.get(key);
    triggerEffect(dep);
}
function triggerEffect(dep) {
    for (const effect of dep) {
        // 通过public获取到scheduler
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}

// 优化 只需要创建一次
const get = createGetter();
const set = createSetter();
const getReadOnly = createGetter(true);
const getShallowReadOnly = createGetter(true, true);
// 创建get
function createGetter(isReadonly = false, isShallowReadOnly = false) {
    return function get(target, key) {
        if (key === "v_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "v_isReadonly" /* ReactiveFlags.IS_READONLY */) {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        if (isShallowReadOnly) {
            return res;
        }
        // 判断嵌套中的对象是否是reactive对象
        if (isObject(res))
            return isReadonly ? readonly(res) : reactive(res);
        return res;
    };
}
// 创建set
function createSetter(isReadonly = false) {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        !isReadonly && trigger(target, key);
        return res;
    };
}
// 创建Proxy
function createProxy(raw, handle) {
    if (!isObject(raw)) {
        console.warn(`target ${raw} 必须是一个对象`);
        return raw;
    }
    return new Proxy(raw, handle);
}
const reactiveHandler = {
    get,
    set,
};
const readonlyHandler = {
    get: getReadOnly,
    set(target, key) {
        console.warn(`key :"${String(key)}" set 失败，因为 target 是 readonly 类型`, target);
        return true;
    }
};
// 响应式对象中嵌套的对象非响应式
const shallowReadonlyHandler = extend({}, readonlyHandler, {
    get: getShallowReadOnly,
});

/**
 * 创建一个响应式数据
 * 数据劫持 proxy
 * get 方法获取到对象属性
 * set 方法更新对象属性
 * 对数据做一个依赖收集
*/
function reactive(raw) {
    return createProxy(raw, reactiveHandler);
}
function readonly(raw) {
    return createProxy(raw, readonlyHandler);
}
// 判断是否是shallowReadonly对象 shallowReadonly内部嵌套的不是响应式对象
function shallowReadonly(raw) {
    return createProxy(raw, shallowReadonlyHandler);
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el
};
const PublicInstanceProxyHandlers = {
    // setupState则为setup方法 return的对象
    get: ({ instance }, key) => {
        const { setupState, props } = instance;
        if (key in setupState) {
            return setupState[key];
        }
        // 将return的值 渲染到页面上
        if (key in props) {
            return props[key];
        }
        // 当我们调用$el时 key为$el
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {}
    };
    return component;
}
// 在component对象上添加props属性
function initProps(instance, rawProps) {
    instance.props = rawProps || {};
    console.log(instance.props, "instance.props");
}
function setupComponent(instance) {
    // TODO
    initProps(instance, instance.vnode.props);
    // initSlots()
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    // 此时的instance上就有了props方法
    const Component = instance.type;
    // 创建一个代理对象 获取setupState中的值
    instance.proxy = new Proxy({ instance }, PublicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        const setupResult = setup(shallowReadonly(instance.props));
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    if (isObject(setupResult)) {
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    instance.render = Component.render;
}

function render(vnode, container) {
    patch(vnode, container);
}
function patch(vnode, container) {
    const { shapeFlag } = vnode;
    if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
        processElement(vnode, container);
    }
    else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        processComponent(vnode, container);
    }
}
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
function mountComponent(vnode, container) {
    const instance = createComponentInstance(vnode);
    setupComponent(instance);
    setupRenderEffect(instance, container, vnode);
}
function processElement(vnode, container) {
    mountElement(vnode, container);
}
function mountElement(vnode, container) {
    const { type, props, children, shapeFlag } = vnode;
    const el = vnode.el = document.createElement(type);
    // const isOn = (key:string) => key.startsWith("on");
    // const isOn = (key:string) => /^on[A-Z]/.test(key)
    for (const key in props) {
        if (isOn(key)) {
            el.addEventListener(key.slice(2).toLowerCase(), props[key]);
        }
        else {
            el.setAttribute(key, props[key]);
        }
    }
    shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */ && (el.innerHTML = children);
    shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */ && mountChildren(vnode, el);
    container.append(el);
}
function mountChildren(vnode, container) {
    vnode.children.forEach((v) => {
        patch(v, container);
    });
}
function setupRenderEffect(instance, container, vnode) {
    // 调用时绑定到代理对象上
    const { proxy } = instance;
    var subTree = instance.render.call(proxy);
    patch(subTree, container);
    // 根节点的el  赋值给组件的虚拟节点上
    vnode.el = subTree.el;
}

function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        shapeFlag: getShapeFlag(type),
        el: null,
    };
    if (isString(children)) {
        vnode.shapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (isArray(children)) {
        vnode.shapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    return vnode;
}
function getShapeFlag(type) {
    return isString(type) ? 1 /* ShapeFlags.ELEMENT */ : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}

// createApp 放入一个根组件 包括render 和 setup
function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            // 组件转换为虚拟节点
            const VNode = createVNode(rootComponent);
            render(VNode, rootContainer);
        }
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

export { createApp, h };
