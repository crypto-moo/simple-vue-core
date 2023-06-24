import { track, trigger } from "./effect"

const get = createGetter()
const set = createSetter()
const readonlyGet = createGetter(true)
const readonlySet = createSetter(true)

function createGetter(isReadonly: boolean = false) {
    return function(target: any, p: string | symbol, receiver: unknown) {
        // console.log('get', target, p, receiver);
        const result = Reflect.get(target, p, receiver)
        if (!isReadonly) {
            // 访问了该属性，需要收集依赖
            track(target, p)
        }
        return result
    }
}

function createSetter(isReadonly: boolean = false) {
    return function(target: any, p: string | symbol, newValue: any, receiver: any) {
        if (isReadonly) {
            console.warn(`cannot set ${String(p)}, because ${target} is readonly`)
            return true
        }
        // console.log('set', target, p, receiver);
        const result = Reflect.set(target, p, newValue)
        // 设置了该属性，需要触发依赖
        trigger(target, p)
        return result
    }
}

export const mutableHandlers = {
    get,
    set
}

export const readonlyHandlers = {
    get: readonlyGet,
    set: readonlySet
}