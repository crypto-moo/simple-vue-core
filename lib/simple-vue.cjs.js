'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var extend = Object.assign;
var isObject = function (obj) {
    return obj !== null && obj !== undefined && typeof obj === 'object';
};
var hasChanged = function (val, val1) {
    return !Object.is(val, val1);
};
var hasOwn = function (obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
};
// add-other ---> addOther
var camelCase = function (str) {
    return str.replace(/-(\w)/g, function (_, c) {
        return c ? c.toUpperCase() : '';
    });
};
// 首字母大写
var capitalized = function (str) {
    return str.substring(0, 1).toUpperCase() + str.substring(1);
};
// 添加on
var toHandlerKey = function (capitalizedStr) {
    return capitalizedStr ? 'on' + capitalizedStr : '';
};
function isEvent(key) {
    return /^on[A-Z]/.test(key);
}

var ReactiveEffect = /** @class */ (function () {
    function ReactiveEffect(fn, scheduler) {
        this._active = true;
        this.deps = [];
        this._fn = fn;
        this.scheduler = scheduler;
    }
    ReactiveEffect.prototype.run = function () {
        // dep = this // 如果写在这里，每次runner执行都会触发收集依赖，不合理，所以注释
        // 执行effect函数，如果该函数调用了响应对象的get方法，则会收集依赖，添加dep到依赖对象
        var res = this._fn();
        // 依赖收集完毕，需要把dep置为undefined，避免每次执行响应对象get方法都重复收集
        // dep = undefined
        return res;
    };
    // 这个方法会执行函数，同时触发收集依赖
    ReactiveEffect.prototype.runAndDep = function () {
        dep = this;
        var res = this._fn();
        dep = undefined;
        return res;
    };
    ReactiveEffect.prototype.stop = function () {
        if (this._active) {
            this._active = false;
            cleanupEffect(this);
        }
    };
    return ReactiveEffect;
}());
function cleanupEffect(effect) {
    var index = effect.deps.indexOf(effect);
    if (index > -1) {
        // console.log('清除前deps：', effect.deps.length);
        effect.deps.splice(index, 1);
        // console.log('清除后deps：', effect.deps.length);
    }
    if (effect.onStop) {
        effect.onStop();
    }
}
var dep;
function effect(fn, options) {
    if (options === void 0) { options = {}; }
    var scheduler = options.scheduler;
    // 每个effect方法、options回有一个对应的ReactiveEffect对象
    var _re = new ReactiveEffect(fn, scheduler);
    // 把options属性全部赋值给ReactiveEffect对象
    extend(_re, options);
    _re.runAndDep();
    var runner = _re.run.bind(_re);
    runner.effect = _re;
    return runner;
}
var targetMap = new Map();
function track(target, p) {
    // track触发是每次响应对象（即reactive包裹的对象）执行get会调用
    // 如果dep不为undefined，则为effect执行后的收集，需要收集依赖，反之不是effect对象收集，无需收集
    if (!dep)
        return;
    var fnMap = targetMap.get(target);
    if (!fnMap) {
        fnMap = {};
        targetMap.set(target, fnMap);
    }
    var deps = fnMap[p];
    if (!deps) {
        deps = [];
        fnMap[p] = deps;
        dep.deps = deps;
    }
    trackEffect(deps);
}
function trackEffect(deps) {
    // 收集依赖时判断依赖是否已收集过。deps也可以用Set，可以省略这个判断
    if (dep && deps.indexOf(dep) < 0) {
        deps.push(dep);
        // console.log('收集依赖：', deps.length, dep);
    }
}
function trigger(target, p) {
    var _fnMap = targetMap.get(target);
    // console.log('触发依赖：', target, p, _fnMap);
    if (!_fnMap)
        return;
    var deps = _fnMap[p];
    triggerEffect(deps);
}
function triggerEffect(deps) {
    if (!deps)
        return;
    // console.log(deps.length);
    deps.forEach(function (dep) {
        if (dep.scheduler) {
            dep.scheduler();
        }
        else {
            dep.run();
        }
    });
}

var get = createGetter();
var set = createSetter();
var readonlyGet = createGetter(true);
var readonlySet = createSetter(true);
var shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly, isShallow) {
    if (isReadonly === void 0) { isReadonly = false; }
    if (isShallow === void 0) { isShallow = false; }
    return function (target, p, receiver) {
        // console.log('get', target, p, receiver);
        if (p === "__v_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (p === "__v_isReadonly" /* ReactiveFlags.IS_READONLY */) {
            return isReadonly;
        }
        var result = Reflect.get(target, p, receiver);
        if (!isReadonly) {
            // 访问了该属性，需要收集依赖
            track(target, p);
        }
        if (isShallow) {
            return result;
        }
        if (isObject(result)) {
            return isReadonly ? readonly(result) : reactive(result);
        }
        return result;
    };
}
function createSetter(isReadonly) {
    if (isReadonly === void 0) { isReadonly = false; }
    return function (target, p, newValue, receiver) {
        if (isReadonly) {
            console.warn("cannot set ".concat(String(p), ", because ").concat(target, " is readonly"));
            return true;
        }
        // console.log('set', target, p, receiver);
        var result = Reflect.set(target, p, newValue);
        // 设置了该属性，需要触发依赖
        trigger(target, p);
        return result;
    };
}
var mutableHandlers = {
    get: get,
    set: set
};
var readonlyHandlers = {
    get: readonlyGet,
    set: readonlySet
};
var shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet
});

function creatReactiveObject(raw, handlers) {
    return new Proxy(raw, handlers);
}
function reactive(raw) {
    return creatReactiveObject(raw, mutableHandlers);
}
function readonly(raw) {
    return creatReactiveObject(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
    return creatReactiveObject(raw, shallowReadonlyHandlers);
}

var RefImpl = /** @class */ (function () {
    function RefImpl(value) {
        this.__v_isRef = true;
        this._changeValue(value);
        this.deps = [];
    }
    Object.defineProperty(RefImpl.prototype, "value", {
        get: function () {
            trackEffect(this.deps);
            return this._value;
        },
        set: function (newVal) {
            if (!hasChanged(this._rawValue, newVal))
                return;
            this._changeValue(newVal);
            triggerEffect(this.deps);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(RefImpl.prototype, "rawValue", {
        get: function () {
            return this._rawValue;
        },
        enumerable: false,
        configurable: true
    });
    RefImpl.prototype._changeValue = function (newVal) {
        this._rawValue = newVal;
        this._value = isObject(newVal) ? reactive(newVal) : newVal;
    };
    return RefImpl;
}());
function ref(value) {
    return new RefImpl(value);
}
function isRef(refVal) {
    return !!refVal.__v_isRef;
}
function unRef(refVal) {
    return isRef(refVal) ? refVal.value : refVal;
}
function proxyRefs(refObj) {
    return new Proxy(refObj, {
        get: function (target, p, receiver) {
            var result = Reflect.get(target, p, receiver);
            return unRef(result);
        },
        set: function (target, p, val, receiver) {
            if (isRef(target[p]) && !isRef(val)) {
                return target[p].value = val;
            }
            return Reflect.set(target, p, val, receiver);
        }
    });
}

function emit(instance, event) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    // console.log('emit:', event, instance);
    var props = instance.props;
    var handlerKey = toHandlerKey(capitalized(camelCase(event)));
    var handler = props[handlerKey];
    if (handler) {
        handler.apply(void 0, args);
    }
    // console.log(toHandlerKey(capitalized(event)));
}

function initProps(instance, props) {
    instance.props = props || {};
}

var publicPropertiesMap = {
    $el: function (i) {
        return i.vnode.$el;
    },
    $slots: function (i) {
        return i.slots;
    }
};
var ComponentPublicInstanceProxyHandlers = {
    get: function (_a, p, receiver) {
        var instance = _a._;
        if (hasOwn(instance.setupState, p)) {
            return instance.setupState[p];
        }
        else if (hasOwn(instance.props, p)) {
            return instance.props[p];
        }
        var publicGetter = publicPropertiesMap[p];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
    set: function (_a, p, newVal, receiver) {
        var instance = _a._;
        var setupState = instance.setupState;
        if (hasOwn(setupState, p)) {
            setupState[p] = newVal;
        }
        return true;
    }
};

function initSlots(instance, slots) {
    // if (isObject(slots)) {
    //     instance.$slots = Array.isArray(slots) ? slots : [slots as VNode]
    // } else {
    //     instance.$slots = [createVNode('div', {}, slots?.toString())]
    // }
    instance.slots = slots;
}

function createComponentInstance(vnode, parent) {
    var instance = {
        vnode: vnode,
        type: vnode.type,
        setupState: {},
        parent: parent,
        provides: parent ? parent.provides || {} : {}
    };
    // 这里绑定emit第一个参数为instance，让外面调用直接传入event和其他参数即可
    instance.emit = emit.bind(null, instance);
    return instance;
}
function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    var Component = instance.type;
    var setup = Component.setup, render = Component.render;
    if (setup) {
        setCurrentInstance(instance);
        var setupResult = setup(shallowReadonly(instance.props), { emit: instance.emit }) || {};
        setCurrentInstance(undefined);
        handleSetupResult(instance, proxyRefs(setupResult));
    }
    if (render) {
        instance.render = render;
    }
}
function handleSetupResult(instance, setupResult) {
    if (typeof setupResult === 'function') ;
    else if (typeof setupResult === 'object') {
        instance.setupState = setupResult;
        instance.proxy = new Proxy({ _: instance }, ComponentPublicInstanceProxyHandlers);
    }
}
var currentInstance;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(i) {
    currentInstance = i;
}

var Fragment = Symbol('Fragment');
var Text = Symbol('Text');
function createVNode(type, props, children) {
    return {
        type: type,
        shapeFlag: getShapeFlag(type, children),
        props: props,
        children: children
    };
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}
function getShapeFlag(type, children) {
    var shapeFlag = typeof type === 'string' ? 1 /* ShapeFlags.ELEMENT */ : 2 /* ShapeFlags.STATEFULE_COMPONENT */;
    if (typeof children === 'string') {
        shapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        shapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    if (shapeFlag & 2 /* ShapeFlags.STATEFULE_COMPONENT */) {
        if (isObject(children)) {
            shapeFlag |= 16 /* ShapeFlags.SLOT_CHILDREN */;
        }
    }
    return shapeFlag;
}

// 1、createApp，返回值为带有mount方法的对象
function createAppApi(render) {
    return function createApp(rootComponent) {
        return {
            mount: function (rootContainer) {
                // 2、创建根组件虚拟节点
                var vnode = createVNode(rootComponent);
                // 3、渲染基于根虚拟节点为dom
                render(vnode, rootContainer);
            }
        };
    };
}

function createRenderer(options) {
    var hostCreateElement = options.createElement, hostPatchProp = options.patchProp, hostInsert = options.insert;
    function render(vnode, rootContainer) {
        // 3.1 调用patch
        patch(null, vnode, rootContainer, null);
    }
    function patch(oldVNode, vnode, rootContainer, parent) {
        if (vnode.type === Fragment) {
            processFragment(oldVNode, vnode, rootContainer, parent);
        }
        else if (vnode.type === Text) {
            processText(oldVNode, vnode, rootContainer);
        }
        else if (vnode.shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
            // console.log(vnode);
            processElement(oldVNode, vnode, rootContainer, parent);
        }
        else if (vnode.shapeFlag & 2 /* ShapeFlags.STATEFULE_COMPONENT */) {
            processComponent(oldVNode, vnode, rootContainer, parent);
        }
    }
    function processText(oldVNode, vnode, parent) {
        var el = document.createTextNode(vnode.children);
        vnode.$el = el;
        parent.appendChild(el);
    }
    function processFragment(oldVNode, vnode, el, parent) {
        mountChildren(vnode.children, el, parent);
    }
    function processComponent(oldVNode, vnode, rootContainer, parent) {
        mountComponent(oldVNode, vnode, rootContainer, parent);
    }
    function mountComponent(oldVNode, vnode, rootContainer, parent) {
        var instance = createComponentInstance(vnode, parent);
        setupComponent(instance);
        effect(function () {
            setupRenderEffect(instance, rootContainer);
        });
    }
    function setupRenderEffect(instance, rootContainer) {
        if (!instance.render)
            return;
        if (instance.isMounted) {
            var subTree = instance.render.call(instance.proxy);
            var prevSubTree = instance.subTree;
            patch(prevSubTree, subTree, rootContainer, instance);
            console.log('prev:', prevSubTree);
            console.log('current:', subTree);
            instance.subTree = subTree;
        }
        else {
            var initVNode = (instance.subTree = instance.render.call(instance.proxy));
            patch(null, initVNode, rootContainer, instance);
            instance.vnode.$el = initVNode.$el;
            instance.isMounted = true;
        }
    }
    function processElement(oldVNode, vnode, rootContainer, parent) {
        if (!oldVNode) {
            mountElement(vnode, rootContainer, parent);
        }
        else {
            updateElement(oldVNode, vnode);
        }
    }
    function updateElement(oldVNode, vnode, container, parent) {
        console.log('update element!', oldVNode.props, vnode.props);
        var oldProps = oldVNode.props;
        var newProps = vnode.props;
        var el = (vnode.$el = oldVNode.$el);
        patchProps(el, oldProps, newProps);
    }
    function patchProps(el, oldProps, newProps) {
        if (oldProps === newProps)
            return;
        for (var key in newProps) {
            if (Object.prototype.hasOwnProperty.call(newProps, key)) {
                var prop = newProps[key];
                var oldProp = oldProps[key];
                if (prop !== oldProp) {
                    hostPatchProp(el, key, prop);
                }
            }
        }
        for (var key in oldProps) {
            if (Object.prototype.hasOwnProperty.call(oldProps, key)) {
                var prop = oldProps[key];
                if (!(key in newProps)) {
                    hostPatchProp(el, key, null);
                }
            }
        }
    }
    function mountElement(vnode, rootContainer, parent) {
        // const node = document.createElement(vnode.type as string)
        var node = hostCreateElement(vnode.type);
        vnode.$el = node;
        if (vnode.shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            node.textContent = vnode.children;
        }
        else if (vnode.shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            mountChildren(vnode.children, node, parent);
        }
        if (vnode.props) {
            for (var key in vnode.props) {
                var val = vnode.props[key];
                hostPatchProp(node, key, val);
                // if (isEvent(key)) {
                //     node.addEventListener(key.substring(2).toLocaleLowerCase(), val)
                // } else {
                //     node.setAttribute(key, val)
                // }
            }
        }
        // rootContainer.appendChild(node)
        hostInsert(node, rootContainer);
    }
    function mountChildren(children, node, parent) {
        children.forEach(function (child) {
            patch(null, child, node, parent);
        });
    }
    return {
        render: render,
        createApp: createAppApi(render)
    };
}

var options = {
    createElement: function (type) {
        console.log("createElement!");
        var node = document.createElement(type);
        return node;
    },
    patchProp: function (node, key, val) {
        console.log("patchProp");
        if (isEvent(key)) {
            node.addEventListener(key.substring(2).toLocaleLowerCase(), val);
        }
        else if (val === null || val === undefined) {
            // 设置为null或者undefined，删除该属性
            node.removeAttribute(key);
        }
        else {
            node.setAttribute(key, val);
        }
    },
    insert: function (node, rootContainer) {
        console.log("insert");
        rootContainer.appendChild(node);
    },
};
var app = createRenderer(options);
var createApp = app.createApp;

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, key, props) {
    var slot = slots[key];
    if (slot && typeof slot === 'function') {
        var slotChildren = slot(props);
        return createVNode(Fragment, {}, Array.isArray(slotChildren) ? slotChildren : [slotChildren]);
    }
    return createVNode('div');
}

// provide\inject必须在setup中使用
function provide(key, value) {
    var _a;
    var instance = getCurrentInstance();
    if (instance) {
        var provides = instance.provides;
        if (provides) {
            var parentProvides = (_a = instance.parent) === null || _a === void 0 ? void 0 : _a.provides;
            if (provides === parentProvides) {
                // 当前的provides值为父provides重新创建一份，不是改的同一份
                provides = instance.provides = Object.create(parentProvides);
            }
            provides[key] = value;
        }
    }
}
function inject(key, defaultVal) {
    var _a;
    var instance = getCurrentInstance();
    if (instance) {
        var provides = (_a = instance.parent) === null || _a === void 0 ? void 0 : _a.provides;
        if (key in provides) {
            return provides[key];
        }
        else if (defaultVal) {
            if (typeof defaultVal === 'function') {
                return defaultVal();
            }
            return defaultVal;
        }
    }
}

exports.createApp = createApp;
exports.createRenderer = createRenderer;
exports.createTextVNode = createTextVNode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.provide = provide;
exports.ref = ref;
exports.renderSlots = renderSlots;
