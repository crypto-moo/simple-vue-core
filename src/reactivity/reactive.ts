import { mutableHandlers, readonlyHandlers, shallowReadonlyHandlers } from "./baseHandlers"

export const enum ReactiveFlags {
    IS_REACTIVE = '__v_isReactive',
    IS_READONLY = '__v_isReadonly'
}

export function creatReactiveObject(raw: any, handlers: ProxyHandler<any>) {
    return new Proxy(raw, handlers)
}

export function reactive(raw: any): any {
    return creatReactiveObject(raw, mutableHandlers)
}

export function readonly(raw: any): any {
    return creatReactiveObject(raw, readonlyHandlers)
}

export function shallowReadonly(raw: any): any {
    return creatReactiveObject(raw, shallowReadonlyHandlers)
}

export function isReactive(value: any) {
    return !!value[ReactiveFlags.IS_REACTIVE]
}

export function isReadonly(value: any) {
    return !!value[ReactiveFlags.IS_READONLY]
}

export function isProxy(value: any) {
    return isReactive(value) || isReadonly(value)
}