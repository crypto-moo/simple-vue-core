import { shallowReadonly } from "../reactivity/reactive";
import { proxyRefs, unRef } from "../reactivity/ref";
import { emit } from "./componentEmits";
import { initProps } from "./componentProps";
import { ComponentPublicInstanceProxyHandlers } from "./componentPublicInstance";
import { initSlots } from "./componentSlots";
import { VNode } from "./vnode";

export type ComponentInstance = {
    vnode: VNode
    type: any
    props?: any
    proxy?: any
    setupState?: any
    render?: Function
    emit?: (event: string) => void 
    slots?: any
    provides: any
    parent?: ComponentInstance
    isMouted?: boolean
    subTree?: VNode
}

export function createComponentInstance(vnode: VNode, parent?: ComponentInstance): ComponentInstance {
    const instance: ComponentInstance = {
        vnode,
        type: vnode.type as any,
        setupState: {},
        parent,
        provides: parent ? parent.provides || {} : {}
    }
    // 这里绑定emit第一个参数为instance，让外面调用直接传入event和其他参数即可
    instance.emit = emit.bind(null, instance)
    return instance;
}

export function setupComponent(instance: ComponentInstance) {
    initProps(instance, instance.vnode.props)

    initSlots(instance, instance.vnode.children)
    
    setupStatefulComponent(instance)
}

function setupStatefulComponent(instance: ComponentInstance) {
    const Component = instance.type

    const {
        setup,
        render
    } = Component
    if (setup) {
        setCurrentInstance(instance)
        const setupResult = setup(shallowReadonly(instance.props), {emit: instance.emit}) || {}
        setCurrentInstance(undefined)
        handleSetupResult(instance, proxyRefs(setupResult))
    }
    if (render) {
        instance.render = render
    }
}


function handleSetupResult(instance: ComponentInstance, setupResult: any) {
    if (typeof setupResult === 'function') {
        // TODO:
    } else if (typeof setupResult === 'object') {
        instance.setupState = setupResult

        instance.proxy = new Proxy({_: instance}, ComponentPublicInstanceProxyHandlers)
    }
}

let currentInstance: ComponentInstance | undefined
export function getCurrentInstance() {
    return currentInstance
}

function setCurrentInstance(i?: ComponentInstance) {
    currentInstance = i
}
