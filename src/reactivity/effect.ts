
class ReactiveEffect {
    private _fn: Function;
    scheduler: Function | undefined;

    constructor(fn: Function, scheduler?: Function) {
        this._fn = fn
        this.scheduler = scheduler
    }

    run() {
        dep = this
        // 执行effect函数，如果该函数调用了响应对象的get方法，则会收集依赖，添加dep到依赖对象
        const res = this._fn()
        // 依赖收集完毕，需要把dep置为undefined，避免每次执行响应对象get方法都重复收集
        dep = undefined
        return res
    }
}

let dep: ReactiveEffect | undefined
export function effect(fn: Function, options: any = {}) {
    const scheduler = options.scheduler
    // 每个effect方法、options回有一个对应的ReactiveEffect对象
    const _re = new ReactiveEffect(fn, scheduler)
    _re.run()
    return _re.run.bind(_re)
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
    }
    console.log('收集依赖：', target, p, dep);
    deps.push(dep)
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