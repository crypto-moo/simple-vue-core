'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var extend = Object.assign;
var isObject = function (obj) {
    return obj !== null && obj !== undefined && typeof obj === 'object';
};
var hasOwn = function (obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
};

var targetMap = new Map();
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

function initProps(instance, props) {
    instance.props = props || {};
}

var publicPropertiesMap = {
    $el: function (i) {
        return i.vnode.$el;
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
    }
};

function createComponentInstance(vnode) {
    return {
        vnode: vnode,
        type: vnode.type,
        setupState: {}
    };
}
function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
    // TODO: initSlots
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    var Component = instance.type;
    var setup = Component.setup, render = Component.render;
    if (setup) {
        var setupResult = setup(shallowReadonly(instance.props)) || {};
        handleSetupResult(instance, setupResult);
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

function render(vnode, rootContainer) {
    // 3.1 调用patch
    patch(vnode, rootContainer);
}
function patch(vnode, rootContainer) {
    if (vnode.shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
        // console.log(vnode);
        processElement(vnode, rootContainer);
    }
    else if (vnode.shapeFlag & 2 /* ShapeFlags.STATEFULE_COMPONENT */) {
        processComponent(vnode, rootContainer);
    }
}
function processComponent(vnode, rootContainer) {
    mountComponent(vnode, rootContainer);
}
function mountComponent(vnode, rootContainer) {
    var instance = createComponentInstance(vnode);
    setupComponent(instance);
    setupRenderEffect(instance, rootContainer);
}
function setupRenderEffect(instance, rootContainer) {
    if (!instance.render)
        return;
    var initVNode = instance.render.call(instance.proxy);
    patch(initVNode, rootContainer);
    instance.vnode.$el = initVNode.$el;
}
function processElement(vnode, rootContainer) {
    mountElement(vnode, rootContainer);
}
function mountElement(vnode, rootContainer) {
    var node = document.createElement(vnode.type);
    vnode.$el = node;
    if (vnode.shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
        node.textContent = vnode.children;
    }
    else if (vnode.shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
        mountChildren(vnode.children, node);
    }
    if (vnode.props) {
        for (var key in vnode.props) {
            var val = vnode.props[key];
            if (isEvent(key)) {
                node.addEventListener(key.substring(2).toLocaleLowerCase(), val);
            }
            else {
                node.setAttribute(key, val);
            }
        }
    }
    rootContainer.appendChild(node);
}
function isEvent(key) {
    return /^on[A-Z]/.test(key);
}
function mountChildren(children, node) {
    children.forEach(function (child) {
        patch(child, node);
    });
}

function createVNode(type, props, children) {
    return {
        type: type,
        shapeFlag: getShapeFlag(type, children),
        props: props,
        children: children
    };
}
function getShapeFlag(type, children) {
    var shapeFlag = typeof type === 'string' ? 1 /* ShapeFlags.ELEMENT */ : 2 /* ShapeFlags.STATEFULE_COMPONENT */;
    if (typeof children === 'string') {
        shapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        shapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    return shapeFlag;
}

// 1、createApp，返回值为带有mount方法的对象
function createApp(rootComponent) {
    return {
        mount: function (rootContainer) {
            // 2、创建根组件虚拟节点
            var vnode = createVNode(rootComponent);
            // 3、渲染基于根虚拟节点为dom
            render(vnode, rootContainer);
        }
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

exports.createApp = createApp;
exports.h = h;
