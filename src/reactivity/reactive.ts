import { mutableHandlers, readonlyHandlers } from "./baseHandlers"

export function reactive(raw: any): any {
    return new Proxy(raw, mutableHandlers)
}

export function readonly(raw: any): any {
    return new Proxy(raw, readonlyHandlers)
}