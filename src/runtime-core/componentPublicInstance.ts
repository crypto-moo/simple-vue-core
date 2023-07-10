import { hasOwn } from '../shared/index';
import { ComponentInstance } from './component';

const publicPropertiesMap: {[p: string | symbol]: (i: ComponentInstance) => any} = {
    $el(i: ComponentInstance) {
        return i.vnode.$el
    },
    $slots(i: ComponentInstance) {
        return i.slots
    }
}

export const ComponentPublicInstanceProxyHandlers = {
    get({_: instance}: {_: ComponentInstance}, p: string | symbol, receiver: unknown) {
        if (hasOwn(instance.setupState, p)) {
            return instance.setupState[p]
        } else if (hasOwn(instance.props, p)) {
            return instance.props[p]
        }

        const publicGetter = publicPropertiesMap[p]
        if (publicGetter) {
            return publicGetter(instance)
        }
    },
    set({_: instance}: {_: ComponentInstance}, p: string | symbol, newVal: any, receiver: unknown) {
        const { setupState } = instance
        if (hasOwn(setupState, p)) {
            setupState[p] = newVal
        }
        return true
    }
}