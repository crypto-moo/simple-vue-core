import { hasChanged, isObject } from "../shared";
import { ReactiveEffect, track, trackEffect, triggerEffect } from "./effect";
import { reactive } from "./reactive";

class RefImpl {
    private _rawValue: any;
    private _value: any
    deps: ReactiveEffect[]

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

    _changeValue(newVal: any) {
        this._rawValue = newVal
        this._value = isObject(newVal) ? reactive(newVal) : newVal
    }
}

export function ref(value: any) {
    return new RefImpl(value)
}