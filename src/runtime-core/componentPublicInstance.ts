import { ComponentInstance } from './component';

const publicPropertiesMap: {[p: string | symbol]: (i: ComponentInstance) => any} = {
    $el(i: ComponentInstance) {
        return i.vnode.$el
    }
}

export const ComponentPublicInstanceProxyHandlers = {
    get({_: instance}: {_: ComponentInstance}, p: string | symbol, receiver: unknown) {
        if (instance.setupState) {
            const val = instance.setupState[p]
            if (val) return val
        }

        const publicGetter = publicPropertiesMap[p]
        if (publicGetter) {
            return publicGetter(instance)
        }
    }
}