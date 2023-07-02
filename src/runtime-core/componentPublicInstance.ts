import { hasOwn } from '../shared/index';
import { ComponentInstance } from './component';

const publicPropertiesMap: {[p: string | symbol]: (i: ComponentInstance) => any} = {
    $el(i: ComponentInstance) {
        return i.vnode.$el
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
    }
}