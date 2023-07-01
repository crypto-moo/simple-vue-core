var publicPropertiesMap = {
    $el: function (i) {
        return i.vnode.$el;
    }
};
var ComponentPublicInstanceProxyHandlers = {
    get: function (_a, p, receiver) {
        var instance = _a._;
        if (instance.setupState) {
            var val = instance.setupState[p];
            if (val)
                return val;
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
        type: vnode.type
    };
}
function setupComponent(instance) {
    // TODO: initProps
    // TODO: initSlots
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    var Component = instance.type;
    var setup = Component.setup, render = Component.render;
    if (setup) {
        var setupResult = setup();
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
    if (typeof vnode.type === 'string') {
        // console.log(vnode);
        processElement(vnode, rootContainer);
    }
    else if (typeof vnode.type === 'object') {
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
    if (typeof vnode.children === 'string') {
        node.textContent = vnode.children;
    }
    else if (Array.isArray(vnode.children)) {
        mountChildren(vnode.children, node);
    }
    if (vnode.props) {
        for (var key in vnode.props) {
            var val = vnode.props[key];
            node.setAttribute(key, val);
        }
    }
    rootContainer.appendChild(node);
}
function mountChildren(children, node) {
    children.forEach(function (child) {
        patch(child, node);
    });
}

function createVNode(type, props, children) {
    return {
        type: type,
        props: props,
        children: children
    };
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

export { createApp, h };
