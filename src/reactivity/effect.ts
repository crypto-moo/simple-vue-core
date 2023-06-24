import { extend } from "../shared";

class ReactiveEffect {
    private _fn: Function;
    private _active = true;
    scheduler: Function | undefined;
    deps: ReactiveEffect[] = [];
    onStop: Function | undefined;

    constructor(fn: Function, scheduler?: Function) {
        this._fn = fn
        this.scheduler = scheduler
    }

    run() {
        // dep = this // 如果写在这里，每次runner执行都会触发收集依赖，不合理，所以注释
        // 执行effect函数，如果该函数调用了响应对象的get方法，则会收集依赖，添加dep到依赖对象
        const res = this._fn()
        // 依赖收集完毕，需要把dep置为undefined，避免每次执行响应对象get方法都重复收集
        // dep = undefined
        return res
    }

    stop() {
        if (this._active) {
            this._active = false
            cleanupEffect(this)
        }
    }
}

function cleanupEffect(effect: ReactiveEffect) {
    const index = effect.deps.indexOf(effect)
    if (index > -1)  {
        console.log('清除前deps：', effect.deps.length);
        effect.deps.splice(index, 1)
        console.log('清除后deps：', effect.deps.length);
    }
    if (effect.onStop) {
        effect.onStop()
    }
}

let dep: ReactiveEffect | undefined
export function effect(fn: Function, options: any = {}) {
    const scheduler = options.scheduler
    // 每个effect方法、options回有一个对应的ReactiveEffect对象
    const _re = new ReactiveEffect(fn, scheduler)
    // 把options属性全部赋值给ReactiveEffect对象
    extend(_re, options)
    dep = _re
    _re.run()
    dep = undefined
    const runner = _re.run.bind(_re)
    runner.effect = _re;
    return runner
}

const targetMap = new Map<any, {[_: string | symbol]: ReactiveEffect[]}>()
export function track(target: any, p: string | symbol) {
    // track触发是每次响应对象（即reactive包裹的对象）执行get会调用
    // 如果dep不为undefined，则为effect执行后的收集，需要收集依赖，反之不是effect对象收集，无需收集
    if (!dep) return
    let fnMap = targetMap.get(target)
    if (!fnMap) {
        fnMap = {}
        targetMap.set(target, fnMap)
    }
    let deps = fnMap[p]
    if (!deps) {
        deps = []
        fnMap[p] = deps
        dep.deps = deps
    }
    deps.push(dep)
    console.log('收集依赖：', deps.length, target, p, dep);
}

export function trigger(target: any, p: string |symbol) {
    const _fnMap = targetMap.get(target)
    if (!_fnMap) return
    const deps = _fnMap[p]
    if (!deps) return
    console.log(deps.length);
    
    deps.forEach(dep => {
        if (dep.scheduler) {
            dep.scheduler()
        } else {
            dep.run()
        }
    })
}

export function stop(runner: Function) {
    runner.effect.stop()
}