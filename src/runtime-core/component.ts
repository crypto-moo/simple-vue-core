import { ComponentPublicInstanceProxyHandlers } from "./componentPublicInstance";
import { VNode } from "./vnode";

export type ComponentInstance = {
    vnode: VNode
    type: any
    proxy?: any
    setupState?: any
    render?: Function
}

export function createComponentInstance(vnode: VNode): ComponentInstance {
    return {
        vnode,
        type: vnode.type as any
    }
}

export function setupComponent(instance: ComponentInstance) {
    // TODO: initProps
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
        const setupResult = setup()
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

