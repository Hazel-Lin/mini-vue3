'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const isObject = (val) => val !== null && typeof val === 'object';
const isString = (value) => typeof value === "string";

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
    console.log(instance, 'instance123');
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
    // function Object
    // TODO function
    if (typeof setupResult === "object") {
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
    isObject(vnode.type) && processComponent(vnode, container);
    isString(vnode.type) && processElement(vnode, container);
}
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
function mountComponent(vnode, container) {
    const instance = createComponentInstance(vnode);
    console.log(instance, 'instance1');
    setupComponent(instance);
    setupRenderEffect(instance, container, vnode);
}
function processElement(vnode, container) {
    mountElement(vnode, container);
}
function mountElement(vnode, container) {
    const { type, props, children } = vnode;
    const el = vnode.el = document.createElement(type);
    if (isObject(props)) {
        for (const key in props) {
            el.setAttribute(key, props[key]);
        }
    }
    isString(children) && (el.innerHTML = children);
    Array.isArray(children) && mountChildren(vnode, el);
    // if (isString(children)) {
    //   el.textContent = children;
    // } else if (Array.isArray(children)) {
    //   mountChildren(vnode, el);
    // }
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
        el: null,
    };
    return vnode;
}

// createApp 放入一个根组件 包括render 和 setup
function createApp(rootComponent) {
    console.log(rootComponent, 'rootComponent');
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

exports.createApp = createApp;
exports.h = h;
