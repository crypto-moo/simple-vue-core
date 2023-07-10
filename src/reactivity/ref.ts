
import { hasChanged, isObject } from "../shared";
import { ReactiveEffect, track, trackEffect, triggerEffect } from "./effect";
import { reactive } from "./reactive";

class RefImpl {
    private _rawValue: any;
    private _value: any
    deps: ReactiveEffect[]
    __v_isRef = true

    constructor(value: any) {
        this._changeValue(value)
        this.deps = []
    }

    get value() {
        trackEffect(this.deps)
        return this._value
    }

    set value(newVal) {
        if (!hasChanged(this._rawValue, newVal)) return
        this._changeValue(newVal)
        triggerEffect(this.deps)
    }

    get rawValue() {
        return this._rawValue
    }

    _changeValue(newVal: any) {
        this._rawValue = newVal
        this._value = isObject(newVal) ? reactive(newVal) : newVal
    }
}

export function ref(value: any) {
    return new RefImpl(value)
}

export function isRef(refVal: RefImpl | any) {
    return !!refVal.__v_isRef
}

export function unRef(refVal: RefImpl | any) {
    return isRef(refVal) ? refVal.value : refVal
}

export function proxyRefs(refObj: any) {
    return new Proxy(refObj, {
        get(target, p, receiver) {
            const result = Reflect.get(target, p, receiver)
            return unRef(result)
        },
        set(target, p, val, receiver) {
            if (isRef(target[p]) && !isRef(val)) {
                return target[p].value = val
            }
            return Reflect.set(target, p, val, receiver)
        }
    })
}
