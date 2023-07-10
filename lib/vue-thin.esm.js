function toDisplayString(value) {
    return String(value);
}

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

const Text = Symbol("Text");
const Fragment = Symbol("Fragment");
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        key: props && props.key,
        shapeFlag: getShapeFlag(type),
        component: null,
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

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
    // 新增$props 表示组件当前已解析的 props 对象。
    $props: (i) => i.props
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
        next: null,
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
    if (compiler && !Component.render) {
        if (Component.template) {
            Component.render = compiler(Component.template);
        }
    }
    instance.render = Component.render;
}
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}
let compiler;
function registerRuntimeCompiler(_compiler) {
    compiler = _compiler;
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
    console.log("🚀 ~ file: createApp.ts:4 ~ createAppAPI ~ render:", render);
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                const vnode = createVNode(rootComponent);
                render(vnode, rootContainer);
            },
        };
    };
}

function shouldUpdateComponent(prevVNode, nextVNode) {
    const { props: prevProps } = prevVNode;
    const { props: nextProps } = nextVNode;
    for (const key in nextProps) {
        if (nextProps[key] !== prevProps[key]) {
            return true;
        }
    }
    return false;
}

const nextTick = (fn) => {
    return fn ? Promise.resolve().then(fn) : Promise.resolve();
};
const quque = [];
let isFlushPending = false;
// 异步队列
const queueJobs = (job) => {
    if (!quque.includes(job)) {
        quque.push(job);
    }
    queueFlush();
};
function queueFlush() {
    if (isFlushPending)
        return;
    isFlushPending = true;
    nextTick(flushJobs);
}
function flushJobs() {
    isFlushPending = false;
    let job;
    // 取出队列中的第一个任务执行
    while (job = quque.shift()) {
        job && job();
    }
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText } = options;
    function render(vnode, container) {
        patch(null, vnode, container, null, null);
    }
    // n1 oldVnode n2 newVnode 
    // n1 存在则为更新 不存在则为初始化
    function patch(n1, n2, container, parentComponent, anchor) {
        const { type, shapeFlag } = n2 || {};
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent, anchor);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    processElement(n1, n2, container, parentComponent, anchor);
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container, parentComponent, anchor);
                }
                break;
        }
    }
    function processText(n1, n2, container) {
        const textNode = n2.el = document.createTextNode(n2.children);
        container.append(textNode);
    }
    function processFragment(n1, n2, container, processFragment, anchor) {
        mountChildren(n2, container, processFragment, anchor);
    }
    function processComponent(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountComponent(n2, container, parentComponent, anchor);
        }
        else {
            updateComponent(n1, n2);
        }
    }
    // 调用render函数 生成虚拟节点 后patch
    // 1.更新组件数据
    // 2.调用render函数
    // 3.更新前判断是否需要更新
    function updateComponent(n1, n2) {
        const instance = (n2.component = n1.component);
        // 避免多余的更新操作
        if (shouldUpdateComponent(n1, n2)) {
            // 通过next传递 使instance获取到更新后的虚拟节点
            instance.next = n2;
            instance.update();
        }
        else {
            // 不需要更新时 需要重置
            n2.el = n1.el;
            instance.vnode = n2;
        }
    }
    function mountComponent(initialVNode, container, parentComponent, anchor) {
        const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent));
        setupComponent(instance);
        setupRenderEffect(instance, container, initialVNode, anchor);
    }
    function processElement(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
            patchElement(n1, n2, container, parentComponent, anchor);
        }
    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        // 值发生改变就需要更新 window.isChange.value = true
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        console.log("n1", n1);
        console.log("n2", n2);
        const el = (n2.el = n1.el);
        patchProps(el, oldProps, newProps);
        // 如果传递的值为container 则直接插入到container中 其他节点会受到影响
        // ”主页“ 这个节点是什么时候被渲染上去的？
        // patchChildren(n1,n2,container,parentComponent);
        patchChildren(n1, n2, el, parentComponent, anchor);
    }
    // 1. 老节点是数组 新节点是text 需要卸载老节点 并且设置text作为新节点
    // 2. 老节点是text 新节点是数组 需要直接移除老节点 并且mountChildren数组新节点
    function patchChildren(n1, n2, container, parentComponent, anchor) {
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
                    mountChildren(nc, container, parentComponent, anchor);
                }
                else {
                    if (oldShapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
                        patchKeyedChildren(oc, nc, container, parentComponent, anchor);
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
    function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
        const l2 = c2.length;
        let i = 0;
        let e1 = c1.length - 1;
        let e2 = l2 - 1;
        function isSomeVNodeType(n1, n2) {
            return n1.type === n2.type && n1.key === n2.key;
        }
        // 左侧
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
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
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        if (i > e1) {
            if (i <= e2) {
                const nextPos = e2 + 1;
                const anchor = nextPos < l2 ? c2[nextPos].el : null;
                while (i <= e2) {
                    patch(null, c2[i], container, parentComponent, anchor);
                    i++;
                }
            }
        }
        else if (i > e2) {
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        else {
            // 中间部分对比
            let s1 = i;
            let s2 = i;
            const toBePatched = e2 - s2 + 1;
            let patched = 0;
            const keyToNewIndexMap = new Map();
            const newIndexToOldIndexMap = new Array(toBePatched);
            let moved = false;
            let maxNewIndexSoFar = 0;
            for (let i = 0; i < toBePatched; i++)
                newIndexToOldIndexMap[i] = 0;
            for (let i = s2; i <= e2; i++) {
                const nextChild = c2[i];
                keyToNewIndexMap.set(nextChild.key, i);
            }
            for (let i = s1; i <= e1; i++) {
                const prevChild = c1[i];
                if (patched >= toBePatched) {
                    hostRemove(prevChild.el);
                    continue;
                }
                let newIndex;
                if (prevChild.key != null) {
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    for (let j = s2; j < e2; j++) {
                        if (isSomeVNodeType(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                if (newIndex === undefined) {
                    hostRemove(prevChild.el);
                }
                else {
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        moved = true;
                    }
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    patch(prevChild, c2[newIndex], container, parentComponent, null);
                    patched++;
                }
            }
            const increasingNewIndexSequence = moved
                ? getSequence(newIndexToOldIndexMap)
                : [];
            let j = increasingNewIndexSequence.length - 1;
            for (let i = toBePatched - 1; i >= 0; i--) {
                const nextIndex = i + s2;
                const nextChild = c2[nextIndex];
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
                if (newIndexToOldIndexMap[i] === 0) {
                    patch(null, nextChild, container, parentComponent, anchor);
                }
                else if (moved) {
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
                        j--;
                    }
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
    function mountElement(vnode, container, parentComponent, anchor) {
        const { type, props, children, shapeFlag } = vnode;
        const el = (vnode.el = hostCreateElement(type));
        for (const key in props) {
            const val = props[key];
            hostPatchProp(el, key, null, val);
        }
        shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */ && (el.innerHTML = children);
        shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */ && mountChildren(vnode.children, el, parentComponent, anchor);
        // 添加anchor 挂载到具体位置
        hostInsert(el, container, anchor);
    }
    function mountChildren(children, container, parentComponent, anchor) {
        children.forEach((v) => {
            patch(null, v, container, parentComponent, anchor);
        });
    }
    function setupRenderEffect(instance, container, vnode, anchor) {
        instance.update = effect(() => {
            if (!instance.isMounted) {
                console.log('初始化');
                // 调用时绑定到代理对象上
                const { proxy } = instance;
                var subTree = instance.subTree = instance.render.call(proxy, proxy);
                patch(null, subTree, container, instance, anchor);
                // 根节点的el  赋值给组件的虚拟节点上
                vnode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                // 页面操作后 触发更新
                console.log('更新');
                // 获取更新后的虚拟节点 vnode旧节点
                const { next, vnode, proxy } = instance;
                if (next) {
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                var subTree = instance.render.call(proxy, proxy);
                // 获取旧值
                var prevSubTree = instance.subTree;
                // 更新旧值
                instance.subTree = subTree;
                // 调用patch后更新或者创建节点
                patch(prevSubTree, subTree, container, instance, anchor);
            }
        }, {
            // 加入异步队列 scheduler就不会反复执行effect函数
            scheduler: () => {
                queueJobs(instance.update);
            }
        });
    }
    return {
        createApp: createAppAPI(render),
    };
}
function updateComponentPreRender(instance, nextVNode) {
    instance.vnode = nextVNode;
    instance.next = null;
    instance.props = nextVNode.props;
}
// 最长递增子序列
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
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
// 关于不传值没有出现报错的问题 有待理解
function insert(el, parent, anchor) {
    parent.insertBefore(el, anchor || null);
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

var runtimeDom = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createApp: createApp,
    h: h,
    renderSlots: renderSlots,
    createTextNode: createTextNode,
    createElementVNode: createVNode,
    getCurrentInstance: getCurrentInstance,
    registerRuntimeCompiler: registerRuntimeCompiler,
    provide: provide,
    inject: inject,
    createRenderer: createRenderer,
    nextTick: nextTick,
    toDisplayString: toDisplayString,
    ref: ref,
    proxyRefs: proxyRefs
});

const TO_DISPLAY_STRING = Symbol("toDisplayString");
const CREATE_ELEMENT_VNODE = Symbol("createElementVNode");
const helperMapName = {
    [TO_DISPLAY_STRING]: "toDisplayString",
    [CREATE_ELEMENT_VNODE]: "createElementVNode",
};

const generate = (ast) => {
    // { children: [ { type: 3, content: 'hi' } ] } 
    console.log(ast, 'ast');
    // 生成string
    // let code = ''
    //  抽取代码
    let result = genContext();
    const { push } = result;
    // const helper = ["toDisplayString"]
    genFunctionPreamble(ast, result);
    let functionName = 'render';
    let p = ['_ctx', '_cache'];
    const signature = p.join(", ");
    let returnStr = "return ";
    push(`return function ${functionName}(${signature}) {`);
    push(returnStr);
    genNode(ast.codegenNode, result);
    push('}');
    // code += `return function ${functionName}(`
    // code +=  p.join(', ') + ') {'
    // code += returnStr +  genNode(ast)
    // code += '}'
    return {
        code: result.code
    };
};
function genFunctionPreamble(ast, result) {
    const { push } = result;
    const aliasHelps = (s) => `${helperMapName[s]}: _${helperMapName[s]}`;
    const _Vue = "Vue";
    if (ast.helpers.length > 0) {
        push(`const { ${ast.helpers.map(aliasHelps).join(', ')} } = ${_Vue}`);
    }
    push("\n");
}
function genNode(node, context) {
    switch (node.type) {
        case 3 /* NodeTypes.TEXT */:
            const { push } = context;
            push(`'${node.content}'`);
            break;
        case 0 /* NodeTypes.INTERPOLATION */:
            genInterpolation(node, context);
            break;
        case 1 /* NodeTypes.SIMPLE_EXPRESSION */:
            genExpression(node, context);
            break;
        case 2 /* NodeTypes.ELEMENT */:
            genElement(node, context);
            break;
        case 5 /* NodeTypes.COMPOUND_EXPRESSION */:
            genCompoundExpression(node, context);
    }
}
function genElement(node, context) {
    const { push, helper } = context;
    const { tag, props, children } = node;
    console.log(props, 'props');
    console.log(children, 'children');
    push(`${helper(CREATE_ELEMENT_VNODE)}(`);
    genNodeList(genNullable([tag, props, children]), context);
    // genNode(children, context);
    // for (let i = 0; i < children.length; i++) {
    //   const child = children[i];
    //   genNode(child, context);
    // }
    push(`)`);
}
function genContext() {
    const context = {
        code: '',
        push(source) {
            context.code += source;
        },
        helper(key) {
            return `_${helperMapName[key]}`;
        }
    };
    return context;
}
function genInterpolation(node, context) {
    const { push, helper } = context;
    push(`${helper(TO_DISPLAY_STRING)}(`);
    genNode(node.content, context);
    push(`)`);
}
function genExpression(node, context) {
    const { push } = context;
    push(`${node.content}`);
}
function genCompoundExpression(node, context) {
    const { children } = node;
    const { push } = context;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isString(child)) {
            push(child);
        }
        else {
            genNode(child, context);
        }
    }
}
function genNullable(arg) {
    return arg.map(item => item ? item : 'null');
}
function genNodeList(nodes, context) {
    const { push } = context;
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (isString(node)) {
            push(node);
        }
        else {
            genNode(node, context);
        }
        if (i < nodes.length - 1) {
            push(", ");
        }
    }
}

const start = "{{";
const end = "}}";
// ast 是一个对象 包含type和children属性
// children是一个数组 包含子节点
// children[0]是一个对象 包含type和content属性
const baseParse = (content) => {
    const context = createParserContext(content);
    // 将这些子节点作为根节点的children
    return createRoot(parseChildren(context, []));
};
// 将内容放置在source中
function createParserContext(content) {
    return {
        source: content,
    };
}
// 解析children 如果一"{{"开始 则为插值 解析插值
// 重点在于如何解析插值
// <div><p>hi</p>{{message}}</div> 解析元素  解析元素 解析文本 解析插值
// <div>hi,{{message}}</div>
// 1. 循环判断属于哪个类型
function parseChildren(context, ancestors) {
    const nodes = [];
    // console.log('isEnd(context)',isEnd(context));
    while (!isEnd(context, ancestors)) {
        let node;
        // context = { source: '{{ message }}' }
        if (context.source.startsWith(start)) {
            node = parseInterpolation(context);
        }
        else if (context.source.startsWith('<')) {
            // 如果第一位是< 则解析element 再判断是否是字母
            // console.log(context,'context1');
            // { source: '<div></div>' } context
            if (/[a-z]/i.test(context.source[1])) {
                node = parseElement(context, ancestors);
            }
            // { type: 2, tag: 'div' }
        }
        // console.log(node,'node');
        // 解析文本
        if (!node) {
            node = parseText(context);
        }
        nodes.push(node);
        // [ { type: 0, content: { type: 1, content: 'message' } } ]
        // console.log(nodes,'nodes');
    }
    return nodes;
}
// 解析文本
function parseText(context) {
    // console.log('context',context.source,context.source.length);
    // 获取到数据 删除空格
    // 删除获取后的代码
    // 直接返回文本节点内容
    // const content = context.source
    let endTokens = ['<', '{{'];
    // let endTokens = '{{'
    let endIndex = context.source.length;
    // 当同时遇到{{或<时 比较两者的index值 取最小的
    // console.log(context.source,'context.source');
    for (let i = 0; i < endTokens.length; i++) {
        const index = context.source.indexOf(endTokens[i]);
        if (index !== -1 && endIndex > index) {
            endIndex = index;
        }
    }
    // console.log(endIndex,'endIndex');
    // if(context.source.indexOf(endTokens) > -1){
    //   endIndex = context.source.indexOf(endTokens)
    // }
    const content = parseTextData(context, endIndex);
    // console.log('content---------',content);
    return {
        type: 3 /* NodeTypes.TEXT */,
        content,
    };
}
function parseElement(context, ancestors) {
    // 处理开始标签 返回tag节点
    const element = parseTag(context, 0 /* TagType.Start */);
    ancestors.push(element);
    // 递归调用parseChildren
    element.children = parseChildren(context, ancestors);
    // console.log(element,'element');
    ancestors.pop();
    if (startsWithEndTagOpen(context.source, element.tag)) {
        // 处理结束标签
        parseTag(context, 1 /* TagType.End */);
    }
    else {
        throw new Error(`缺少结束标签:${element.tag}`);
    }
    return element;
}
// 设置一个全局变量
// let parseEndTag:any = null;
// 此时context应该是 <div></div>
function parseTag(context, type) {
    // console.log('context2',context);
    // <div>hi,{{message}}</div>
    const match = /^<\/?([a-z]*)/i.exec(context.source);
    // console.log('match-----',match);
    // parseEndTag = match[1]
    const tag = match[1];
    // 删除处理完成的标签
    advanceBy(context, match[0].length);
    advanceBy(context, 1);
    // console.log('context.source',context.source);
    // 处理结束标签时 不需要返回节点
    if (type === 1 /* TagType.End */)
        return;
    return {
        type: 2 /* NodeTypes.ELEMENT */,
        tag,
    };
}
// 解析插值 '{{ message }}'
function parseInterpolation(context) {
    // 2
    const sl = start.length;
    const closeIndex = context.source.indexOf(end, sl);
    if (closeIndex < 0) {
        console.error('插值缺少结束定界符');
    }
    // 11 获取到结束括号 }} 开始的位置
    // console.log('closeIndex',closeIndex);
    // console.log('context',context);
    // 向前推进2位 ' message }}'
    advanceBy(context, sl);
    // 获取到插值的内容 message 的长度 可能存在空格
    const rawContentLength = closeIndex - sl;
    // console.log('context.source',context.source);
    //  context.source =  message }}
    const rawContent = context.source.slice(0, rawContentLength);
    // const rawContent = context.source.slice(sl,closeIndex)
    const content = rawContent.trim();
    // 插值取值完成后 删除插值的内容
    advanceBy(context, rawContentLength + end.length);
    return {
        type: 0 /* NodeTypes.INTERPOLATION */,
        content: {
            type: 1 /* NodeTypes.SIMPLE_EXPRESSION */,
            content,
        },
    };
}
function advanceBy(context, length) {
    context.source = context.source.slice(length);
}
function createRoot(children) {
    return {
        children,
        type: 4 /* NodeTypes.ROOT */
    };
}
// <div><span></div> 只要在数组中找到和结束标签相同的标签就结束 并且报错
// 每一次parseElement的时候都将tag标签存储在一个数组中
function isEnd(context, ancestors) {
    // 1. 当source为空时 返回true
    // 2. 当遇到结束标签时 返回true
    const s = context.source;
    if (s.startsWith('</')) {
        for (let i = ancestors.length - 1; i >= 0; i--) {
            let tag = ancestors[i].tag;
            if (startsWithEndTagOpen(s, tag)) {
                return true;
            }
        }
    }
    // if(s.startsWith(`</${ancestors}>`)){
    //   return true;
    // }
    return !s;
}
function startsWithEndTagOpen(source, tag) {
    return (source.startsWith("</") &&
        source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase());
}
function parseTextData(context, length) {
    const content = context.source.slice(0, length);
    // 2. 推进
    advanceBy(context, length);
    return content;
}

// 2. 修改节点内容
const transform = (root, options = {}) => {
    console.log('transform', root);
    const context = createTransformContext(root, options);
    console.log('context', context);
    traverseNode(root, context);
    createRootCodegen(root);
    root.helpers = new Set([...context.helpers.keys()]);
};
function createRootCodegen(root) {
    const child = root.children[0];
    if (child.type === 2 /* NodeTypes.ELEMENT */) {
        root.codegenNode = child.codegenNode;
    }
    else {
        root.codegenNode = root.children[0];
    }
}
function createTransformContext(root, options) {
    const context = {
        root,
        nodeTransforms: options.nodeTransforms || [],
        helpers: new Map(),
        helper(key) {
            context.helpers.set(key, 1);
        }
    };
    return context;
}
function traverseNode(node, context) {
    const nodeTransforms = context.nodeTransforms;
    const exitFns = [];
    for (let i = 0; i < nodeTransforms.length; i++) {
        const transform = nodeTransforms[i];
        // 递归调用transform函数
        const onExit = transform(node, context);
        onExit && exitFns.push(onExit);
    }
    switch (node.type) {
        case 0 /* NodeTypes.INTERPOLATION */:
            context.helper(TO_DISPLAY_STRING);
            break;
        case 4 /* NodeTypes.ROOT */:
        case 2 /* NodeTypes.ELEMENT */:
            traverseChildren(node, context);
            break;
    }
    let i = exitFns.length;
    while (i--) {
        exitFns[i]();
    }
}
function traverseChildren(node, context) {
    const children = node.children;
    if (children) {
        for (let i = 0; i < children.length; i++) {
            const node = children[i];
            traverseNode(node, context);
        }
    }
}

function createVNodeCall(context, tag, props, children) {
    context.helper(CREATE_ELEMENT_VNODE);
    return {
        type: 2 /* NodeTypes.ELEMENT */,
        tag,
        props,
        children,
    };
}

const transformElement = function (node, context) {
    if (node.type === 2 /* NodeTypes.ELEMENT */) {
        return () => {
            const { props, tag, children } = node;
            const vnodeTag = `"${tag}"`;
            const vnodeProps = props;
            let vnodeChildren = children[0];
            node.codegenNode = createVNodeCall(context, vnodeTag, vnodeProps, vnodeChildren);
        };
    }
};

// 处理节点
function transformExpression(node) {
    if (node.type === 0 /* NodeTypes.INTERPOLATION */) {
        node.content = processExpression(node.content);
    }
}
function processExpression(node) {
    node.content = `_ctx.${node.content}`;
    return node;
}

function isText(node) {
    return node.type === 3 /* NodeTypes.TEXT */ || node.type === 0 /* NodeTypes.INTERPOLATION */;
}

const transformText = function (node) {
    let currentContainer;
    if (node.type === 2 /* NodeTypes.ELEMENT */) {
        return () => {
            const children = node.children;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (isText(child)) {
                    for (let j = i + 1; j < children.length; j++) {
                        const next = children[j];
                        if (isText(next)) {
                            if (!currentContainer) {
                                currentContainer = children[i] = {
                                    type: 5 /* NodeTypes.COMPOUND_EXPRESSION */,
                                    children: [child],
                                };
                            }
                            currentContainer.children.push(" + ");
                            currentContainer.children.push(next);
                            children.splice(j, 1);
                            j--;
                        }
                        else {
                            currentContainer = undefined;
                            break;
                        }
                    }
                }
            }
        };
    }
};

// 将template 编译成 render函数
function baseCompile(template) {
    const ast = baseParse(template);
    transform(ast, {
        nodeTransforms: [transformExpression, transformElement, transformText],
    });
    return generate(ast);
}

// mini-vue 出口
function compileToFunction(template) {
    const { code } = baseCompile(template);
    const render = new Function("Vue", code)(runtimeDom);
    console.log(registerRuntimeCompiler, 'registerRuntimeCompiler');
    return render;
}
registerRuntimeCompiler(compileToFunction);

export { createApp, createVNode as createElementVNode, createRenderer, createTextNode, getCurrentInstance, h, inject, nextTick, provide, proxyRefs, ref, registerRuntimeCompiler, renderSlots, toDisplayString };
