# 项目构建流程

## 项目初始化

> 配置 ts，集成 jest 做单元测试

### 1、初始化命令

```
yarn init -y
```

### 2、项目主目录 src，放置各模块

---| reactivity

### 3、各模块新建 tests 文件夹，为对应模块单元测试文件

### 4、集成 ts

```
npx tsc --init

```

如果报错需要安装 typescript，执行下面命令

```
yarn add typescript --dev
```

### 5、添加 jest、@types/jest

```
yarn add jest @types/jest --dev
```

如果单元测试文件还是报错，需要在 tsconfig.json 配置

```
"types": ["jest"],
```

### 6、添加单元测试脚本

package.json 添加

```
"scripts": {
    "test": "jest"
}
```

### 7、验证单元测试文件引用模块

/src/reactivity/index.ts

```
export function add(a: number, b: number) {
    return a + b
}
```

/src/reactivity/tests/index.spec.ts

```
import { add } from "../index";

it('init ', () => {
    expect(true).toBe(true);
    expect(add(1, 2)).toBe(3);
});
```

运行 yarn test 后报错，

```
SyntaxError: Cannot use import statement outside a module
```

> 报错说明：由于 jest 运行环境是 node.js 环境，node.js 环境模块引入规范是 CommonJS，而 import xxx from xxx 是 ECMA Script Modules（ESM）规范，不兼容导致，需要配置 babel 转化规范

### 8、安装 babel

安装 babel-jest、@babel/core、@babel/preset-env

```
yarn add babel-jest @babel/core @babel/preset-env --dev
```

添加 babel 对于 ts 的支持

```
yarn add @babel/preset-typescript --dev
```

创建 babel.config.js

```
module.exports = {
    presets: [
        [
            "@babel/preset-env",
            {
                targets: {
                    node: "current"
                }
            }
        ],
        "@babel/preset-typescript"
    ]
}
```

## 项目核心 - reactivity

### 1、实现 reactive、effect、依赖收集、依赖触发

#### 1.1 单元测试

reactive.spec.ts：验证代理功能

```
import { reactive } from "../reactive"

describe('reactive', () => {
    it('core', () => {
        const obj = {foo: 1}
        const rxObj = reactive(obj)

        expect(obj).not.toBe(rxObj)

        expect(obj.foo).toBe(rxObj.foo)
    })
})
```

effect.spec.ts：副作用，依赖收集、依赖触发

```
import { effect } from "../effect"
import { reactive } from "../reactive"

describe('effect', () => {
    it('core', () => {
        const obj = {
            num: 1,
            name: 'abc'
        }
        const rxObj = reactive(obj)

        let num
        effect(() => {
            num = rxObj.num + 1
        })

        expect(num).toBe(2)

        let num1
        effect(() => {
            num1 = rxObj.num + 1
        })
        rxObj.num++
        expect(num).toBe(3)
        expect(num1).toBe(3)
        rxObj.name = 'def'
    })

    it('runner', () => {
        let num = 1
        const runner = effect(() => {
            num++
            return 'effect'
        })

        expect(num).toBe(2)

        const res = runner()
        expect(num).toBe(3)
        expect(res).toBe('effect')
    })
})
```

#### 1.2 功能实现

reactive.ts

```
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
```

> 问题：如果报错找不到 Proxy，需要再 tsconfig.json - compilerOptions 设置"lib": ["DOM", "ES6"]

effect.ts

```
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
```

### 2、实现 effect scheduler 功能

> - 通过 effect 的第二个参数给定的 一个 scheduler 的 fn <br>
> - effect 第一次执行的时候 还会执行 fn<br>
> - 当 响应式对象 set update 不会执行 fn 而是执行 scheduler<br>
> - 如果说当执行 runner 的时候，会再次的执行 fn
>  
#### 2.1 单元测试
effect.spec.ts
```
it('scheduler', () => {
    const obj = {num: 1}
    const rxObj = reactive(obj)
    let num
    let run: Function | undefined
    const scheduler = jest.fn(() => {
        run = runner
    })
    const runner = effect(() => {
        num = rxObj.num
    }, {
        scheduler
    })
    expect(num).toBe(1)
    expect(scheduler).not.toHaveBeenCalled()

    rxObj.num++
    expect(num).toBe(1)
    expect(scheduler).toHaveBeenCalledTimes(1)
    if (run) {
        run()
    }
    expect(num).toBe(2)
})
```
#### 2.2 功能实现
effect.ts 添加代码

```
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
        // 触发依赖，对象有scheduler，则执行scheduler
        if (dep.scheduler) {
            dep.scheduler()
        } else {
            dep.run()
        }
    })
}
```

### 3、实现 effect stop 功能

#### 3.1 单元测试
effect.spec.ts
```
it('stop', () => {
    const obj = {num: 1}
    const rxObj = reactive(obj)
    let num
    const runner = effect(() => {
        num = rxObj.num
    })
    // expect(num).toBe(1)
    rxObj.num = 2
    expect(num).toBe(2)
    stop(runner)
    rxObj.num = 3
    expect(num).toBe(2)
    runner()
    expect(num).toBe(3)
})

it('on stop', () => {
    const obj = {foo: 1}
    const rxObj = reactive(obj)
    const onStop = jest.fn(() => {

    })
    let foo
    const runner = effect(() => {
        foo = rxObj.foo
    }, {
        onStop
    })
    stop(runner)
    expect(onStop).toHaveBeenCalledTimes(1)
})
```
#### 3.2 功能实现
effect.ts
```
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

export function effect(fn: Function, options: any = {}) {
    const scheduler = options.scheduler
    // 每个effect方法、options回有一个对应的ReactiveEffect对象
    const _re = new ReactiveEffect(fn, scheduler)
    // 把options属性全部赋值给ReactiveEffect对象
    extend(_re, options)
    // 这里有个改动，把dep赋值与置为undefined移到这里
    dep = _re
    _re.run()
    dep = undefined
    const runner = _re.run.bind(_re)
    runner.effect = _re;
    return runner
}

export function track(target: any, p: string | symbol) {
    ...

    if (!deps) {
        deps = []
        fnMap[p] = deps
        dep.deps = deps
    }
    
    ...
}

...

export function stop(runner: Function) {
    runner.effect.stop()
}
```
### 4、实现 readonly
#### 4.1 单元测试
readonly.spec.ts
```
import { readonly } from "../reactive"

describe('readonly', () => {
    it('core', () => {
        const obj = {num: 1}
        const rxObj = readonly(obj)
        expect(rxObj).not.toBe(obj)
        expect(rxObj.num).toBe(1)
    })

    it('set warning', () => {
        console.warn = jest.fn()
        const obj = {num: 1}
        const rxObj = readonly(obj)
        rxObj.num = 2
        expect(console.warn).toBeCalled()
    })
})
```
#### 4.2 功能实现
新增baseHandlers.ts文件，把代理所需选项抽离到该文件
```
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
```
reactive.ts优化
```
import { mutableHandlers, readonlyHandlers } from "./baseHandlers"

export function reactive(raw: any): any {
    return new Proxy(raw, mutableHandlers)
}

export function readonly(raw: any): any {
    return new Proxy(raw, readonlyHandlers)
}
```

### 5、实现isReactive、isReadonly以及对象对应reactive、readonly嵌套转化
#### 5.1 单元测试
reactive.spec.ts
```
describe('reactive', () => {
    it('core', () => {
        ...

        expect(isReactive(rxObj)).toBe(true)
        expect(isReactive(obj)).toBe(false)
    })

    it('nested reactive', () => {
        const obj = {
            nested: {
                foo: 1
            },
            array: [1, 2, 3]
        }
        const rxObj = reactive(obj)
        expect(isReactive(rxObj)).toBe(true)
        expect(isReactive(rxObj.nested)).toBe(true)
        expect(isReactive(rxObj.array)).toBe(true)
    })
})
```
readonly.spec.ts
```
describe('readonly', () => {
    it('core', () => {
        const obj = {
            num: 1,
            foo: {
                name: 'foo'
            }
        }
        ...
        expect(isReadonly(rxObj)).toBe(true)
        expect(isReadonly(obj)).toBe(false)
        expect(isReadonly(rxObj.foo)).toBe(true)
    })
})
```
#### 5.2 功能实现
reactive.ts
```
export const enum ReactiveFlags {
    IS_REACTIVE = '__v_isReactive',
    IS_READONLY = '__v_isReadonly'
}

...

export function isReactive(value: any) {
    return !!value[ReactiveFlags.IS_REACTIVE]
}

export function isReadonly(value: any) {
    return !!value[ReactiveFlags.IS_READONLY]
}
```
baseHandlers.ts
```
function createGetter(isReadonly: boolean = false) {
    return function(target: any, p: string | symbol, receiver: unknown) {
        if (p === ReactiveFlags.IS_REACTIVE) {
            return !isReadonly
        } else if (p === ReactiveFlags.IS_READONLY) {
            return isReadonly
        }
        ...
        if (isObject(result)) {
            return isReadonly ? readonly(result) : reactive(result)
        }
        ...
    }
}
```

### 6、实现shallowReadonly、isProxy、ref功能
#### 6.1 单元测试
shallowReadonly.spec.ts
```
import { isReactive, isReadonly, readonly, shallowReadonly } from "../reactive"

describe('shallowReadonly', () => {
    it('core', () => {
        const obj = {
            foo: {
                num: 1
            }
        }
        const srObj = shallowReadonly(obj)
        const rObj = readonly(obj)
        expect(isReactive(srObj)).toBe(false)
        expect(srObj).not.toBe(rObj)
        expect(isReadonly(srObj)).toBe(true)
        expect(isReadonly(srObj.foo)).toBe(false)
    })
})
```
ref.spec.ts
```
import { effect } from "../effect"
import { ref } from "../ref"

describe('ref', () => {
    it('core', () => {
        const refFoo = ref(1)
        expect(refFoo.value).toBe(1)

        let num = 1
        let foo
        effect(() => {
            num++
            foo = refFoo.value  
        })
        expect(num).toBe(2)
        expect(foo).toBe(1)

        refFoo.value++
        expect(num).toBe(3)
        expect(foo).toBe(2)

        refFoo.value = 2
        expect(num).toBe(3)
        expect(foo).toBe(2)
    })

    it('ref is reactive', () => {
        const obj = {foo: 1}
        const refObj = ref(obj)
        let foo
        effect(() => {
            foo = refObj.value.foo
        })
        expect(foo).toBe(1)
        refObj.value.foo = 2
        expect(foo).toBe(2)
        
        refObj.value = obj
        expect(foo).toBe(2)

    })
})
```
#### 6.2 功能实现
reactive.ts
```
import { mutableHandlers, readonlyHandlers, shallowReadonlyHandlers } from "./baseHandlers"

export const enum ReactiveFlags {
    IS_REACTIVE = '__v_isReactive',
    IS_READONLY = '__v_isReadonly'
}

export function creatReactiveObject(raw: any, handlers: ProxyHandler<any>) {
    return new Proxy(raw, handlers)
}

export function reactive(raw: any): any {
    return creatReactiveObject(raw, mutableHandlers)
}

export function readonly(raw: any): any {
    return creatReactiveObject(raw, readonlyHandlers)
}

export function shallowReadonly(raw: any): any {
    return creatReactiveObject(raw, shallowReadonlyHandlers)
}

export function isReactive(value: any) {
    return !!value[ReactiveFlags.IS_REACTIVE]
}

export function isReadonly(value: any) {
    return !!value[ReactiveFlags.IS_READONLY]
}

export function isProxy(value: any) {
    return isReactive(value) || isReadonly(value)
}
```
ref.ts
```
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
```
effect.ts
```

export function trackEffect(deps: ReactiveEffect[]) {
    if (dep) {
        deps.push(dep)
    }
}

...

export function triggerEffect(deps: ReactiveEffect[]) {
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
```
### 7、实现isRef、unRef、proxyRefs
#### 7.1 单元测试
```
describe('ref', () => {
    ...

    it('is ref', () => {
        const refObj = ref(1)
        const rxObj = reactive({name: 'wawa'})
        expect(isRef(refObj)).toBe(true)
        expect(isRef(1)).toBe(false)
        expect(isRef(rxObj)).toBe(false)
    })

    it.skip('un ref', () => {
        const refObj = ref(1)
        expect(unRef(refObj)).toBe(1)
        const obj = {name: 'wawa'}
        const refObj1 = ref(obj)
        expect(unRef(refObj1)).toBe(obj)
    })

    it.only('proxy refs', () => {
        const obj = {
            user: ref('wawa'),
            age: 20
        }
        const pr = proxyRefs(obj)
        expect(obj.user.value).toBe('wawa')
        expect(pr.user).toBe('wawa')
        expect(pr.age).toBe(20)

        pr.user = 'haha'
        expect(obj.user.value).toBe('haha')
        expect(pr.user).toBe('haha')
        expect(pr.age).toBe(20)

        pr.user = 'gaga'
        pr.age = 30
        expect(obj.user.value).toBe('gaga')
        expect(pr.user).toBe('gaga')
        expect(pr.age).toBe(30)
    })
})
```
#### 7.2 功能实现
```

class RefImpl {
    __v_isRef = true
    
    ...

    get rawValue() {
        return this._rawValue
    }
}

export function isRef(refVal: RefImpl | any) {
    return !!refVal.__v_isRef
}

export function unRef(refVal: RefImpl | any) {
    return isRef(refVal) ? refVal.rawValue : refVal
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
```

