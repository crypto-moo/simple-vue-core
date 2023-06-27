import { extend, isObject } from "../shared"
import { track, trigger } from "./effect"
import { ReactiveFlags, reactive, readonly } from "./reactive"

const get = createGetter()
const set = createSetter()
const readonlyGet = createGetter(true)
const readonlySet = createSetter(true)
const shallowReadonlyGet = createGetter(true, true)

function createGetter(isReadonly: boolean = false, isShallow: boolean = false) {
    return function(target: any, p: string | symbol, receiver: unknown) {
        // console.log('get', target, p, receiver);
        if (p === ReactiveFlags.IS_REACTIVE) {
            return !isReadonly
        } else if (p === ReactiveFlags.IS_READONLY) {
            return isReadonly
        }
        const result = Reflect.get(target, p, receiver)
        if (!isReadonly) {
            // 访问了该属性，需要收集依赖
            track(target, p)
        }
        if (isShallow) {
            return result
        }
        if (isObject(result)) {
            return isReadonly ? readonly(result) : reactive(result)
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

export const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet
})