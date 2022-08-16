const isObject = (val) => val !== null && typeof val === 'object';
const isFunction = (val) => typeof val === 'function';
const isString = (value) => typeof value === "string";
const isArray = Array.isArray;
const extend = Object.assign;
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : "";
    });
};
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
const toHandlerKey = (str) => {
    return str ? "on" + capitalize(str) : "";
};

const Text = Symbol("Text");
const Fragment = Symbol("Fragment");
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
    if (vnode.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        if (isObject(children)) {
            vnode.shapeFlag |= 16 /* ShapeFlags.SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function createTextNode(text) {
    return createVNode(Text, {}, text);
}
function getShapeFlag(type) {
    return isString(type) ? 1 /* ShapeFlags.ELEMENT */ : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

const renderSlots = (slots, name, params) => {
    const slotName = slots[name];
    if (slotName) {
        if (isFunction(slotName)) {
            // 避免渲染多余的div节点
            return createVNode("Fragment", {}, slotName(params));
        }
    }
};

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
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots
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
        // 当我们调用$el时 key为$el $slots key为$slots
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

// event 为用户传递的事件名称
const emit = (instance, event, ...args) => {
    const { props } = instance;
    const handlerName = toHandlerKey(camelize(event));
    const handler = props[handlerName];
    handler && handler(...args);
};

let currentInstance = null;
function createComponentInstance(vnode, parent) {
    const component = {
        vnode,
        type: vnode.type,
        emit: () => { },
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        parent,
        setupState: {}
    };
    component.emit = emit.bind(null, component);
    return component;
}
// 在component对象上添加props属性
function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}
// 在component对象上添加slots属性 
function initSlots(instance, children) {
    const { vnode } = instance;
    if (vnode.shapeFlag & 16 /* ShapeFlags.SLOT_CHILDREN */) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    for (const key in children) {
        const value = children[key];
        // value 是一个函数
        slots[key] = (params) => normalizeSlotValue(value(params));
    }
}
function normalizeSlotValue(value) {
    return isArray(value) ? value : [value];
}
function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    // 此时的instance上就有了props方法
    const Component = instance.type;
    // 创建一个代理对象 获取setupState中的值
    instance.proxy = new Proxy({ instance }, PublicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });
        setCurrentInstance(null);
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
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

// 存储数据
function provide(key, value) {
    let currentInstance = getCurrentInstance();
    if (!currentInstance) {
        return;
    }
    else {
        let { provides } = currentInstance;
        const parentProvides = currentInstance.parent.provides;
        if (provides === parentProvides) {
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}
// 获取数据
function inject(key, defaultValue) {
    let currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            if (isFunction(defaultValue)) {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}

function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                const vnode = createVNode(rootComponent);
                render(vnode, rootContainer);
            },
        };
    };
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, } = options;
    function render(vnode, container) {
        patch(vnode, container, null);
    }
    function patch(vnode, container, parentComponent) {
        const { type, shapeFlag } = vnode || {};
        switch (type) {
            case Fragment:
                processFragment(vnode, container, parentComponent);
                break;
            case Text:
                processText(vnode, container);
                break;
            default:
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    processElement(vnode, container, parentComponent);
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    processComponent(vnode, container, parentComponent);
                }
                break;
        }
    }
    function processText(vnode, container) {
        const el = vnode.el = document.createTextNode(vnode.children);
        container.append(el);
    }
    function processFragment(vnode, container, processFragment) {
        mountChildren(vnode, container, processFragment);
    }
    function processComponent(vnode, container, parentComponent) {
        mountComponent(vnode, container, parentComponent);
    }
    function mountComponent(vnode, container, parentComponent) {
        const instance = createComponentInstance(vnode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, container, vnode);
    }
    function processElement(vnode, container, parentComponent) {
        mountElement(vnode, container, parentComponent);
    }
    function mountElement(vnode, container, parentComponent) {
        const { type, props, children, shapeFlag } = vnode;
        const el = (vnode.el = hostCreateElement(type));
        // const el = vnode.el = document.createElement(type);
        // const isOn = (key:string) => key.startsWith("on");
        // const isOn = (key:string) => /^on[A-Z]/.test(key)
        for (const key in props) {
            const val = props[key];
            hostPatchProp(el, key, val);
            // if(isOn(key)){
            //   el.addEventListener(key.slice(2).toLowerCase(),props[key]);
            // }else {
            //   el.setAttribute(key, props[key]);
            // }
        }
        shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */ && (el.innerHTML = children);
        shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */ && mountChildren(vnode, el, parentComponent);
        // container.append(el);
        hostInsert(el, container);
    }
    function mountChildren(vnode, container, parentComponent) {
        vnode.children.forEach((v) => {
            patch(v, container, parentComponent);
        });
    }
    function setupRenderEffect(instance, container, vnode) {
        // 调用时绑定到代理对象上
        const { proxy } = instance;
        var subTree = instance.render.call(proxy);
        patch(subTree, container, instance);
        // 根节点的el  赋值给组件的虚拟节点上
        vnode.el = subTree.el;
    }
    return {
        createApp: createAppAPI(render),
    };
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, val) {
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, val);
    }
    else {
        el.setAttribute(key, val);
    }
}
function insert(el, parent) {
    parent.append(el);
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
});
function createApp(...args) {
    return renderer.createApp(...args);
}

export { createApp, createRenderer, createTextNode, getCurrentInstance, h, inject, provide, renderSlots };
