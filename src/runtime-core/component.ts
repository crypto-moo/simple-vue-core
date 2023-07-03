import { shallowReadonly } from "../reactivity/reactive";
import { emit } from "./componentEmits";
import { initProps } from "./componentProps";
import { ComponentPublicInstanceProxyHandlers } from "./componentPublicInstance";
import { VNode } from "./vnode";

export type ComponentInstance = {
    vnode: VNode
    type: any
    props?: any
    proxy?: any
    setupState?: any
    render?: Function
    emit?: (event: string) => void 
}

export function createComponentInstance(vnode: VNode): ComponentInstance {
    const instance: ComponentInstance = {
        vnode,
        type: vnode.type as any,
        setupState: {},
    }
    // 这里绑定emit第一个参数为instance，让外面调用直接传入event和其他参数即可
    instance.emit = emit.bind(null, instance)
    return instance;
}

export function setupComponent(instance: ComponentInstance) {
    initProps(instance, instance.vnode.props)

    // TODO: initSlots
    
    setupStatefulComponent(instance)
}

function setupStatefulComponent(instance: ComponentInstance) {
    const Component = instance.type

    const {
        setup,
        render
    } = Component
    if (setup) {
        const setupResult = setup(shallowReadonly(instance.props), {emit: instance.emit}) || {}
        handleSetupResult(instance, setupResult)
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

