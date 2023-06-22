import { track, trigger } from "./effect"

export function reactive(obj: any): any {
    return new Proxy(obj, {
        get(target, p, receiver) {
            const result = Reflect.get(target, p, receiver)
            // 访问了该属性，需要收集依赖
            track(target, p)
            return result
        },
        set(target, p, newValue) {
            const result = Reflect.set(target, p, newValue)
            // 设置了该属性，需要触发依赖
            trigger(target, p)
            return result
        }
    })
}