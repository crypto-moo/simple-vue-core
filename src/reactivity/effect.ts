
class ReactiveEffect {
    private _fn: Function;

    constructor(fn: Function) {
        this._fn = fn
    }

    run() {
        return this._fn()
    }
}

let dep: ReactiveEffect
export function effect(fn: Function) {
    const _re = new ReactiveEffect(fn)
    dep = _re
    _re.run()
    return _re.run.bind(_re)
}

const targetMap = new Map<any, {[_: string | symbol]: ReactiveEffect[]}>()
export function track(target: any, p: string | symbol) {
    let fnMap = targetMap.get(target)
    if (!fnMap) {
        fnMap = {}
        targetMap.set(target, fnMap)
    }
    let deps = fnMap[p]
    if (!deps) {
        deps = []
        fnMap[p] = deps
    }
    deps.push(dep)
}

export function trigger(target: any, p: string |symbol) {
    const _fnMap = targetMap.get(target)
    if (!_fnMap) return
    const deps = _fnMap[p]
    if (!deps) return
    deps.forEach(dep => dep.run())
}