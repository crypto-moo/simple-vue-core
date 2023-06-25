import { mutableHandlers, readonlyHandlers } from "./baseHandlers"

export const enum ReactiveFlags {
    IS_REACTIVE = '__v_isReactive',
    IS_READONLY = '__v_isReadonly'
}

export function reactive(raw: any): any {
    return new Proxy(raw, mutableHandlers)
}

export function readonly(raw: any): any {
    return new Proxy(raw, readonlyHandlers)
}

export function isReactive(value: any) {
    return !!value[ReactiveFlags.IS_REACTIVE]
}

export function isReadonly(value: any) {
    return !!value[ReactiveFlags.IS_READONLY]
}