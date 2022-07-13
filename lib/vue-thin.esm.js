const isObject = (val) => val !== null && typeof val === 'object';
const isString = (value) => typeof value === "string";
const isArray = Array.isArray;
const onRE = /^on[^a-z]/;
const isOn = (key) => onRE.test(key);

const publicPropertiesMap = {
    $el: (i) => i.vnode.el
};
const PublicInstanceProxyHandlers = {
    get: ({ instance }, key) => {
        const { setupState } = instance;
        if (key in setupState) {
            return setupState[key];
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
function setupComponent(instance) {
    // TODO
    // initProps()
    // initSlots()
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    // 创建一个代理对象 获取setupState中的值
    instance.proxy = new Proxy({ instance }, PublicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        const setupResult = setup();
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
