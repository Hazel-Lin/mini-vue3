'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const isObject = (val) => val !== null && typeof val === 'object';
const isFunction = (val) => typeof val === 'function';
const isString = (value) => typeof value === "string";
const isArray = Array.isArray;
const extend = Object.assign;
// 判断是否需要改变
const hasChanged = (newValue, oldValue) => {
    return !Object.is(newValue, oldValue);
};
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
const isEqual = (oldVal, newVal) => {
    return oldVal === newVal;
};
const EMPTY_OBJ = {};
function isSameVNodeType(n1, n2) {
    // 比较type和key是否相等
    return n1.type === n2.type && n1.key === n2.key;
}

const Text = Symbol("Text");
const Fragment = Symbol("Fragment");
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        key: props && props.key,
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

let activeEffect;
let shouldTrack = true;
const targetMap = new Map();
class ReactiveEffect {
    constructor(handle, scheduler) {
        this._handle = null;
        this.depList = [];
        this.flag = true;
        this._handle = handle;
        this.scheduler = scheduler;
    }
    run() {
        // this为当前实例对象
        activeEffect = this;
        shouldTrack = true;
        // 返回执行函数的返回值
        return this._handle();
    }
    // 调用stop方法后 删除掉对应的effect
    stop() {
        if (this.flag) {
            cleanupEffect(this);
            this.onStop && this.onStop();
            this.flag = false;
        }
    }
}
function cleanupEffect(effect) {
    effect.depList.forEach((el) => {
        el.delete(effect);
    });
    // 把 effect.deps 清空
    effect.depList.length = 0;
}
// 副作用函数 调用后返回runner函数
// 如何在更新的时候只执行scheduler
function effect(handle, options = {}) {
    const _effect = new ReactiveEffect(handle, options.scheduler);
    extend(_effect, options);
    // 调用run方法执行依赖
    _effect.run();
    // 返回run 方法
    const runner = _effect.run.bind(_effect);
    // 将effect添加到runner中便于后续其他地方调用
    runner.effect = _effect;
    return runner;
}
/**
 * 依赖收集
 * target目标对象 key和value分别为目标对象中的键和值
 * target { age:10 } key = age
 * 名称不能重复
 * 获取到target对象中的每一个key对应的值
 * targetMap 所有响应式对象
 * depsMap 具体某一个响应式对象的key的所有依赖
 * dep 具体某一个key的依赖
 * 初始化的时候
 * targetMap Map(0) {{ age:10 } => depsMap Map(0)}
 * depsMap Map(0) {age => dep Set(0)}
 *
*/
function track(target, key) {
    if (!isTracking())
        return;
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    trackEffect(dep);
}
function trackEffect(dep) {
    if (dep.has(activeEffect))
        return;
    // 收集依赖
    dep.add(activeEffect);
    // 反向收集对应的dep
    activeEffect.depList.push(dep);
}
// 判断是否在收集
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}
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
        !isReadonly && track(target, key);
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
// raw为目标对象 需要代理的对象
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
        isMounted: false,
        subTree: {},
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
        // instance.setupState = setupResult;
        instance.setupState = proxyRefs(setupResult);
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
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText } = options;
    function render(vnode, container) {
        patch(null, vnode, container, null);
    }
    // n1 oldVnode n2 newVnode 
    // n1 存在则为更新 不存在则为初始化
    function patch(n1, n2, container, parentComponent) {
        const { type, shapeFlag } = n2 || {};
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    processElement(n1, n2, container, parentComponent);
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container, parentComponent);
                }
                break;
        }
    }
    function processText(n1, n2, container) {
        const textNode = n2.el = document.createTextNode(n2.children);
        container.append(textNode);
    }
    function processFragment(n1, n2, container, processFragment) {
        mountChildren(n2, container, processFragment);
    }
    function processComponent(n1, n2, container, parentComponent) {
        mountComponent(n2, container, parentComponent);
    }
    function mountComponent(vnode, container, parentComponent) {
        const instance = createComponentInstance(vnode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, container, vnode);
    }
    function processElement(n1, n2, container, parentComponent) {
        if (!n1) {
            mountElement(n2, container, parentComponent);
        }
        else {
            patchElement(n1, n2, container, parentComponent);
        }
    }
    function patchElement(n1, n2, container, parentComponent) {
        // 值发生改变就需要更新 window.isChange.value = true
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        const el = (n2.el = n1.el);
        patchProps(el, oldProps, newProps);
        // 如果传递的值为container 则直接插入到container中 其他节点会受到影响
        // ”主页“ 这个节点是什么时候被渲染上去的？
        // patchChildren(n1,n2,container,parentComponent);
        patchChildren(n1, n2, el, parentComponent);
    }
    // 1. 老节点是数组 新节点是text 需要卸载老节点 并且设置text作为新节点
    // 2. 老节点是text 新节点是数组 需要直接移除老节点 并且mountChildren数组新节点
    function patchChildren(n1, n2, container, parentComponent) {
        const { children: oc, shapeFlag: oldShapeFlag } = n1;
        const { children: nc, shapeFlag: newShapeFlag } = n2;
        if (!isEqual(oc, nc)) {
            // 老节点是数组 新节点是text 
            if (newShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
                oldShapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */ && unmountChildren(oc);
                // (n2.el.innerHTML = nc);
                // 应该为container 而不是n2.el
                // hostSetElementText(n2.el,nc);
                hostSetElementText(container, nc);
            }
            // 老节点是text 新节点是数组
            // 当新老节点都是数组时 需要用到我们常说的diff算法去对比
            if (newShapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
                if (oldShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
                    // oldShapeFlag & ShapeFlags.TEXT_CHILDREN && n1.el.remove();
                    // 应该为container 而不是n2.el
                    oldShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */ && hostSetElementText(container, '');
                    // 挂载数组节点
                    mountChildren(nc, container, parentComponent);
                }
                else {
                    if (oldShapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
                        patchKeyedChildren(oc, nc, container, parentComponent);
                    }
                }
            }
        }
    }
    // 当节点为数组的时候 更新节点才需要先去卸载节点
    function unmountChildren(children) {
        children.forEach(child => {
            hostRemove(child.el);
            // 以下也为卸载节点的方式
            // if(child.shapeFlag & ShapeFlags.ELEMENT){
            //   child.el.remove();
            // }
        });
    }
    // 新旧节点做diff算法 对比是否相等
    function patchKeyedChildren(c1, c2, container, parentComponent) {
        console.log('patchKeyedChildren', c1, c2);
        let i = 0;
        const l2 = c2.length;
        // c1、c2的长度索引
        let e1 = c1.length - 1;
        let e2 = c2.length - 1;
        // i的值必须小于两个数组的长度
        // 左侧
        while (i <= e1 && i <= e2) {
            // 两者相等 则继续patch
            const n1 = c1[i];
            const n2 = c2[i];
            if (isSameVNodeType(n1, n2)) {
                console.log(c1[i], c2[i], 1111);
                patch(n1, n2, container, parentComponent);
            }
            else {
                break;
            }
            i++;
        }
        // 右侧
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSameVNodeType(n1, n2)) {
                console.log(n1, n2, 1111);
                patch(n1, n2, container, parentComponent);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        // 新的比老的长
        if (i > e1) {
            if (i <= e2) {
                // 找到对应的锚点位置
                const nextPos = e2 + 1;
                nextPos < l2 ? c2[nextPos].el : null;
                //  因为新增的节点不止有一个 需要while循环 遍历所有
                while (i <= e2) {
                    // create a new vnode
                    patch(null, c2[i], container, parentComponent);
                    i++;
                }
            }
        }
    }
    function patchProps(el, oldProps, newProps) {
        if (!isEqual(oldProps, newProps)) {
            for (const key in newProps) {
                const oldValue = oldProps[key];
                const newValue = newProps[key];
                if (oldValue !== newValue) {
                    hostPatchProp(el, key, oldValue, newValue);
                }
            }
            if (oldProps !== EMPTY_OBJ) {
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    function mountElement(vnode, container, parentComponent) {
        const { type, props, children, shapeFlag } = vnode;
        const el = (vnode.el = hostCreateElement(type));
        for (const key in props) {
            const val = props[key];
            hostPatchProp(el, key, null, val);
        }
        shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */ && (el.innerHTML = children);
        shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */ && mountChildren(vnode.children, el, parentComponent);
        hostInsert(el, container);
    }
    function mountChildren(children, container, parentComponent) {
        children.forEach((v) => {
            patch(null, v, container, parentComponent);
        });
    }
    function setupRenderEffect(instance, container, vnode) {
        effect(() => {
            if (!instance.isMounted) {
                console.log('初始化');
                // 调用时绑定到代理对象上
                const { proxy } = instance;
                var subTree = instance.subTree = instance.render.call(proxy);
                patch(null, subTree, container, instance);
                // 根节点的el  赋值给组件的虚拟节点上
                vnode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                console.log('更新');
                const { proxy } = instance;
                var subTree = instance.render.call(proxy);
                // 获取旧值
                var prevSubTree = instance.subTree;
                // 更新旧值
                instance.subTree = subTree;
                patch(prevSubTree, subTree, container, instance);
            }
        });
    }
    return {
        createApp: createAppAPI(render),
    };
}

// 方法抽离
function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, prevVal, newVal) {
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, newVal);
    }
    else {
        if (newVal === undefined || newVal === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, newVal);
        }
    }
}
function insert(el, parent, achor) {
    parent.append(el);
    parent.insertBefore(el, achor);
}
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
function setElementText(el, text) {
    el.textContent = text;
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText
});
function createApp(...args) {
    return renderer.createApp(...args);
}

class Ref {
    constructor(value) {
        this.v_isRef = true;
        // 判断value是否是一个对象 是对象则按reactive处理 否则不处理
        this._rawValue = value;
        this._value = convert(value);
        this.deps = new Set();
    }
    get value() {
        if (isTracking()) {
            // 收集依赖
            trackEffect(this.deps);
        }
        return this._value;
    }
    set value(newValue) {
        // 判断两者是否相等 相等则return
        if (!hasChanged(newValue, this._rawValue))
            return;
        this._rawValue = newValue;
        this._value = convert(newValue);
        // 触发依赖
        triggerEffect(this.deps);
    }
}
// 判断是否是对象  如果将一个对象赋值给 ref，那么这个对象将通过 reactive() 转为具有深层次响应式的对象。
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
// ref 触发依赖收集
function ref(raw) {
    return new Ref(raw);
}
// 检查值是否为一个 ref 对象
function isRef(ref) {
    return !!ref.v_isRef;
}
// 如果参数是一个 ref，则返回内部值，否则返回参数本身。
// 这是 val = isRef(val) ? val.value : val 的语法糖函数。
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
// 返回ref的值
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value);
            }
            else {
                return Reflect.set(target, key, value);
            }
        }
    });
}

exports.createApp = createApp;
exports.createRenderer = createRenderer;
exports.createTextNode = createTextNode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.provide = provide;
exports.proxyRefs = proxyRefs;
exports.ref = ref;
exports.renderSlots = renderSlots;
