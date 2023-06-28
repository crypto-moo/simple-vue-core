import { ReactiveEffect } from "./effect";

// ComputedRefImpl为computed描述对象
class ComputedRefImpl {
    // get value时候是否读取缓存，默认不读取
    private _cache: boolean = false
    // 上次缓存的值
    private _value: any
    // 用于收集依赖
    private _effect: ReactiveEffect;

    constructor(getter: Function) {
        this._effect = new ReactiveEffect(getter, () => {
            // computed函数内部响应式值改变会调用该方法（scheduler），把读取缓存设为false，在get value时会重新计算
            console.log('*** scheduler *** ');
            this._cache = false
        })
    }

    get value() {
        // 不读取缓存重新计算，同时以后读取缓存
        if (!this._cache) {
            this._cache = true
            // effect调用runAndDep会执行runner以及触发收集依赖
            this._value = this._effect.runAndDep()
        }
        return this._value
    }
}

export function computed(getter: Function) {
    return new ComputedRefImpl(getter)
}